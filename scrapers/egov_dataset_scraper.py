"""
Lookout — Скрапер data.egov.kz с API ключом
Находит датасет с юридическими лицами и импортирует их в Supabase

Установка: pip install requests supabase python-dotenv
Запуск:    python scrapers/egov_dataset_scraper.py
"""

import os
import sys
import json
import time
import logging
import re
import requests
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# ─── Конфиг ──────────────────────────────────────────────
API_KEY   = os.environ.get('EGOV_API_KEY', '1bb8e04aa62c4300b8dd962ea91aabbc')
BASE_URL  = 'https://data.egov.kz/api/v4'
BATCH     = 500   # записей за один запрос (max ~1000)
DELAY     = 0.3   # секунд между запросами

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Возможные названия датасета с юрлицами в data.egov.kz
CANDIDATE_DATASETS = [
    'gosreestr_jurid',
    'yuridicheskie_lica',
    'yuridikalyk_tulga',
    'legal_entities',
    'zerde_jurid',
    'minjust_jurid',
    'mn_jurid',
    'reestr_yurid',
    'registraciya_yurid',
    'juridical',
    'companies_kz',
    'bin_registry',
    'taxpayers',
    'kgd_taxpayers',
]


def api_get(path: str, params: dict = {}) -> Optional[dict]:
    """Выполняет GET запрос к API"""
    url = f'{BASE_URL}/{path}'
    params['api_key'] = API_KEY
    try:
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 200:
            return r.json()
        log.debug(f'  {r.status_code} для {url}')
        return None
    except Exception as e:
        log.debug(f'  Ошибка запроса: {e}')
        return None


def find_company_dataset() -> Optional[tuple[str, str]]:
    """
    Ищет датасет с данными о юридических лицах.
    Возвращает (dataset_name, version) или None.
    """
    log.info('Ищем датасет с юридическими лицами...')

    # Шаг 1: Ищем через catalog API если он есть
    catalog = api_get('datasets', {'search': 'юридические лица', 'size': 20})
    if catalog and isinstance(catalog, list):
        for ds in catalog:
            name = ds.get('name') or ds.get('id') or ''
            title = ds.get('title') or ds.get('label') or ''
            log.info(f'  Найден: {name} — {title}')

    # Шаг 2: Перебираем кандидатов
    for dataset in CANDIDATE_DATASETS:
        log.info(f'  Проверяем: {dataset}')
        result = api_get(f'mapping/{dataset}')
        if result and not result.get('error'):
            # Датасет существует! Определяем версию
            versions = list(result.get(dataset, {}).get('mappings', {}).keys())
            version = versions[0] if versions else 'v1'
            fields = list(result.get(dataset, {}).get('mappings', {}).get(version, {}).get('properties', {}).keys())
            log.info(f'  ✓ Датасет найден: {dataset}/{version}')
            log.info(f'    Поля: {fields[:10]}')

            # Проверяем есть ли поле похожее на БИН
            bin_like = [f for f in fields if 'bin' in f.lower() or 'idn' in f.lower() or 'iin' in f.lower()]
            if bin_like:
                log.info(f'    БИН-поля: {bin_like}')
                return dataset, version

        time.sleep(0.2)

    return None


def fetch_batch(dataset: str, version: str, offset: int, size: int) -> list:
    """Загружает батч записей из датасета"""
    query = json.dumps({'from': offset, 'size': size})
    result = api_get(f'{dataset}/{version}', {'source': query})

    if not result:
        return []
    if isinstance(result, list):
        return result
    if isinstance(result, dict) and 'hits' in result:
        return result['hits'].get('hits', [])
    return []


def detect_fields(sample: dict) -> dict:
    """Определяет маппинг полей из примера записи"""
    mapping = {}
    keys = [k.lower() for k in sample.keys()]

    # БИН
    for k in sample:
        if k.lower() in ['bin', 'бин', 'iinbin', 'iin_bin', 'iin/bin']:
            mapping['bin'] = k
            break

    # Название
    for k in sample:
        kl = k.lower()
        if any(w in kl for w in ['nameru', 'name_ru', 'наименование', 'name', 'fullname', 'atauы']):
            if 'bin' not in kl:
                mapping['name_ru'] = k
                break

    # Другие поля
    field_patterns = {
        'name_kz':    ['namekz', 'name_kz', 'атауы', 'fullnamekz'],
        'legal_form': ['krp', 'orgform', 'opf', 'pravovaya', 'форма'],
        'industry_code': ['oked', 'okved', 'код окэд', 'codeokey'],
        'industry_name': ['okedname', 'viddeyatelnosti', 'деятельность'],
        'address':    ['address', 'adres', 'адрес', 'locality'],
        'region':     ['region', 'oblast', 'область'],
        'status':     ['status', 'статус', 'sostoyanie'],
        'registration_date': ['regdate', 'firstregdate', 'дата регистрации', 'datareg'],
        'director_name': ['fio', 'director', 'head', 'руководитель'],
    }

    for field, patterns in field_patterns.items():
        for k in sample:
            if any(p in k.lower() for p in patterns):
                mapping[field] = k
                break

    return mapping


def transform(row: dict, field_map: dict, bin_field: str) -> Optional[dict]:
    """Преобразует строку датасета в формат базы"""
    bin_code = str(row.get(bin_field, '')).strip()
    if not bin_code or len(bin_code) != 12 or not bin_code.isdigit():
        return None

    name = str(row.get(field_map.get('name_ru', ''), '')).strip()
    if not name or len(name) < 2:
        return None

    address = str(row.get(field_map.get('address', ''), '')).strip() or None

    status_raw = str(row.get(field_map.get('status', ''), '')).lower()
    if any(w in status_raw for w in ['действующ', 'актив', 'active']):
        status = 'active'
    elif any(w in status_raw for w in ['ликвидир', 'прекращ']):
        status = 'liquidated'
    else:
        status = 'active'

    reg_date = None
    reg_raw = str(row.get(field_map.get('registration_date', ''), '')).strip()
    for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%Y.%m.%d'):
        try:
            reg_date = datetime.strptime(reg_raw[:10], fmt).strftime('%Y-%m-%d')
            break
        except:
            continue

    city = extract_city(address or '')

    tmap = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
            'з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o',
            'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts',
            'ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya','ъ':'','ь':''}
    slug_name = ''.join(tmap.get(c, c) for c in name.lower())
    slug_name = re.sub(r'[^a-z0-9]+', '-', slug_name).strip('-')[:50]

    return {
        'bin':               bin_code,
        'name_ru':           name[:255],
        'name_kz':           str(row.get(field_map.get('name_kz', ''), '') or '')[:255] or None,
        'status':            status,
        'registration_date': reg_date,
        'legal_form':        str(row.get(field_map.get('legal_form', ''), '') or '')[:100] or None,
        'industry_code':     str(row.get(field_map.get('industry_code', ''), '') or '')[:20] or None,
        'industry_name':     str(row.get(field_map.get('industry_name', ''), '') or '')[:200] or None,
        'address':           address[:500] if address else None,
        'region':            str(row.get(field_map.get('region', ''), '') or '')[:100] or None,
        'city':              city[:100] or None,
        'director_name':     str(row.get(field_map.get('director_name', ''), '') or '')[:200] or None,
        'slug':              f'{slug_name}-{bin_code[-6:]}',
        'last_scraped_at':   datetime.utcnow().isoformat(),
    }


def extract_city(address: str) -> str:
    cities = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз', 'Павлодар',
              'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай', 'Кызылорда',
              'Уральск', 'Петропавловск', 'Актау', 'Темиртау', 'Туркестан']
    for city in cities:
        if city.lower() in address.lower():
            return city
    return address.split(',')[0].strip()[:50] if address else ''


def save_batch(rows: list) -> tuple[int, int]:
    """Сохраняет батч в Supabase"""
    if not rows:
        return 0, 0
    try:
        supabase.table('companies').upsert(rows, on_conflict='bin').execute()
        return len(rows), 0
    except Exception as e:
        log.error(f'Ошибка сохранения батча: {e}')
        # Пробуем по одному
        ok = err = 0
        for row in rows:
            try:
                supabase.table('companies').upsert(row, on_conflict='bin').execute()
                ok += 1
            except:
                err += 1
        return ok, err


def run():
    # 1. Находим датасет
    found = find_company_dataset()
    if not found:
        log.error('\nДатасет с юридическими лицами не найден.')
        log.error('Попробуй зайти на https://data.egov.kz и найти нужный датасет вручную.')
        log.error('Потом передай его название: python egov_dataset_scraper.py НАЗВАНИЕ_ДАТАСЕТА')
        sys.exit(1)

    dataset, version = found
    log.info(f'\nИспользуем датасет: {dataset}/{version}')

    # 2. Берём первый батч чтобы определить поля
    log.info('Загружаем тестовый батч для определения полей...')
    sample_batch = fetch_batch(dataset, version, 0, 5)
    if not sample_batch:
        log.error('Не удалось загрузить данные')
        sys.exit(1)

    log.info(f'Пример записи: {json.dumps(sample_batch[0], ensure_ascii=False, indent=2)}')

    # 3. Определяем маппинг полей
    field_map = detect_fields(sample_batch[0])
    bin_field = field_map.get('bin')

    if not bin_field:
        log.error('Не найдено поле с БИН. Поля в датасете:')
        log.error(list(sample_batch[0].keys()))
        sys.exit(1)

    log.info(f'Маппинг полей: {field_map}')

    # 4. Импортируем всё
    log.info('\nНачинаем импорт...')
    total_ok = total_err = offset = 0

    while True:
        log.info(f'  Загружаем {offset}–{offset+BATCH}...')
        batch = fetch_batch(dataset, version, offset, BATCH)

        if not batch:
            log.info('  Данные закончились')
            break

        transformed = []
        for row in batch:
            t = transform(row, field_map, bin_field)
            if t:
                transformed.append(t)

        ok, err = save_batch(transformed)
        total_ok += ok
        total_err += err

        log.info(f'  ✓ Сохранено: {total_ok} | ✗ Пропущено: {total_err}')

        if len(batch) < BATCH:
            break

        offset += BATCH
        time.sleep(DELAY)

    log.info(f'\n═══ Импорт завершён ═══')
    log.info(f'Всего импортировано: {total_ok}')
    log.info(f'Пропущено (нет БИН/имени): {total_err}')


if __name__ == '__main__':
    # Можно передать название датасета напрямую:
    # python egov_dataset_scraper.py gosreestr_jurid
    if len(sys.argv) > 1:
        dataset_name = sys.argv[1]
        version = sys.argv[2] if len(sys.argv) > 2 else 'v1'
        log.info(f'Используем указанный датасет: {dataset_name}/{version}')
        # Проверяем поля
        result = api_get(f'mapping/{dataset_name}')
        if result:
            log.info(f'Поля: {json.dumps(result, ensure_ascii=False, indent=2)[:500]}')
        # Запускаем импорт
        sample = fetch_batch(dataset_name, version, 0, 3)
        if sample:
            log.info(f'Пример: {json.dumps(sample[0], ensure_ascii=False, indent=2)}')
    else:
        run()
