"""
TrustLink — Скрапер данных компаний из eGov Казахстана
Запуск: python scrapers/egov_scraper.py

Требования: pip install requests supabase python-dotenv
"""

import os
import time
import logging
from datetime import datetime
from typing import Optional
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# ─── Конфиг ──────────────────────────────────────────────
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']  # Используем service key для записи
EGOV_API_BASE = 'https://stat.gov.kz/api'  # Открытый API stat.gov.kz
REQUEST_DELAY = 0.5  # Задержка между запросами (сек)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_company_by_bin(bin_code: str) -> Optional[dict]:
    """Получает данные компании. Пробует несколько источников по очереди."""

    # Источник 1: КГД (Комитет государственных доходов)
    result = _try_kgd(bin_code)
    if result:
        return result

    # Источник 2: stat.gov.kz (новый endpoint)
    result = _try_stat_gov(bin_code)
    if result:
        return result

    log.warning(f'All sources failed for BIN {bin_code}')
    return None


def _try_kgd(bin_code: str) -> Optional[dict]:
    """Получает данные с КГД"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://kgd.gov.kz/',
        }
        url = f'https://kgd.gov.kz/ru/app/culs-search-by-bin-iin-api?bin={bin_code}'
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        if not data or not isinstance(data, dict):
            return None

        # КГД возвращает список или объект — обрабатываем оба варианта
        item = data if 'bin' in data else (data.get('data') or [{}])[0]
        if not item:
            return None

        return {
            'bin': bin_code,
            'name_ru': item.get('taxpayerName') or item.get('fullNameRu') or item.get('name', ''),
            'name_kz': item.get('fullNameKz'),
            'status': 'active' if item.get('taxpayerStatusRu', '').lower() in ['действующий', 'активный'] else 'suspended',
            'registration_date': parse_date(item.get('registerDate') or item.get('regDate')),
            'legal_form': item.get('organizationForm') or item.get('orgFormRu'),
            'industry_code': item.get('primaryActivityCode') or item.get('okedCode'),
            'industry_name': item.get('primaryActivityRu') or item.get('okedNameRu'),
            'address': item.get('address') or item.get('regAddressRu'),
            'city': extract_city(item.get('address') or item.get('regAddressRu') or ''),
            'director_name': item.get('headFio') or item.get('director'),
            'last_scraped_at': datetime.now(datetime.timezone.utc if hasattr(datetime, 'timezone') else None).isoformat(),
        }
    except requests.RequestException as e:
        log.debug(f'KGD failed for {bin_code}: {e}')
        return None
    except Exception as e:
        log.debug(f'KGD parse error for {bin_code}: {e}')
        return None


def _try_stat_gov(bin_code: str) -> Optional[dict]:
    """Получает данные с stat.gov.kz"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }
        # Актуальный endpoint stat.gov.kz
        url = f'https://stat.gov.kz/api/juridical/counter/api/?bin={bin_code}&lang=ru'
        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code == 404:
            # Пробуем альтернативный путь
            url = f'https://stat.gov.kz/api/juridical/search?bin={bin_code}&lang=ru'
            response = requests.get(url, headers=headers, timeout=15)

        response.raise_for_status()
        data = response.json()

        if not data:
            return None

        # Обрабатываем разные форматы ответа
        if isinstance(data, list):
            item = data[0] if data else None
        elif isinstance(data, dict):
            item = data.get('obj') or data.get('data') or data
        else:
            return None

        if not item or not isinstance(item, dict):
            return None

        return {
            'bin': bin_code,
            'name_ru': item.get('nameRu') or item.get('name', ''),
            'name_kz': item.get('nameKz'),
            'status': map_status(item.get('statusNameRu', '')),
            'registration_date': parse_date(item.get('firstRegDate') or item.get('regDate')),
            'legal_form': item.get('krpNameRu'),
            'industry_code': item.get('okedCode'),
            'industry_name': item.get('okedNameRu'),
            'address': item.get('localityRu') or item.get('address'),
            'city': extract_city(item.get('localityRu') or item.get('address') or ''),
            'director_name': item.get('fio'),
            'last_scraped_at': datetime.now(datetime.timezone.utc if hasattr(datetime, 'timezone') else None).isoformat(),
        }
    except requests.RequestException as e:
        log.debug(f'stat.gov.kz failed for {bin_code}: {e}')
        return None
    except Exception as e:
        log.debug(f'stat.gov.kz parse error for {bin_code}: {e}')
        return None


def map_status(oked_code: str) -> str:
    """Маппинг кодов статуса"""
    # Упрощённое определение — в реальности нужно смотреть поле statusName
    return 'active'


def parse_date(date_str: Optional[str]) -> Optional[str]:
    """Парсит дату в формат YYYY-MM-DD"""
    if not date_str:
        return None
    try:
        # Пробуем разные форматы
        for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S'):
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
    except Exception:
        pass
    return None


def extract_city(address: str) -> str:
    """Извлекает город из адреса"""
    if not address:
        return 'Казахстан'
    # Основные города
    cities = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз', 'Павлодар',
              'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай', 'Кызылорда',
              'Уральск', 'Петропавловск', 'Актау', 'Темиртау', 'Туркестан']
    for city in cities:
        if city.lower() in address.lower():
            return city
    return address.split(',')[0].strip() if ',' in address else address[:50]


def upsert_company(data: dict) -> bool:
    """Сохраняет или обновляет компанию в Supabase"""
    try:
        # Генерируем slug
        slug = generate_slug(data['name_ru'], data['bin'])
        data['slug'] = slug

        result = supabase.table('companies').upsert(
            data,
            on_conflict='bin'
        ).execute()

        return len(result.data) > 0
    except Exception as e:
        log.error(f"Supabase upsert failed for BIN {data.get('bin')}: {e}")
        return False


def generate_slug(name: str, bin_code: str) -> str:
    """Генерирует URL slug для компании"""
    import re
    translitmap = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
        'и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh',
        'щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya','ъ':'','ь':'',
    }
    slug = name.lower()
    slug = ''.join(translitmap.get(c, c) for c in slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return f"{slug}-{bin_code[-6:]}"


def log_scraper_run(source: str, status: str, processed: int, updated: int, errors: int):
    """Логирует результат работы скрапера"""
    try:
        supabase.table('scraper_logs').insert({
            'source': source,
            'status': status,
            'companies_processed': processed,
            'companies_updated': updated,
            'errors_count': errors,
            'finished_at': datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        log.error(f'Failed to log scraper run: {e}')


def run_batch_scrape(bin_list: list[str]):
    """Парсит список БИН"""
    log.info(f'Starting batch scrape of {len(bin_list)} companies')
    processed = updated = errors = 0

    for i, bin_code in enumerate(bin_list):
        log.info(f'[{i+1}/{len(bin_list)}] Scraping BIN: {bin_code}')

        data = get_company_by_bin(bin_code)
        processed += 1

        if data:
            if upsert_company(data):
                updated += 1
                log.info(f'✓ Updated: {data["name_ru"]}')
            else:
                errors += 1
        else:
            errors += 1
            log.warning(f'✗ No data for BIN: {bin_code}')

        time.sleep(REQUEST_DELAY)  # Вежливый парсинг

    log.info(f'Done. Processed: {processed}, Updated: {updated}, Errors: {errors}')
    log_scraper_run('egov', 'completed', processed, updated, errors)


def get_bins_to_update(limit: int = 1000) -> list[str]:
    """Получает БИН компаний, которые давно не обновлялись"""
    try:
        result = supabase.table('companies').select('bin').order(
            'last_scraped_at', desc=False, nullsfirst=True
        ).limit(limit).execute()
        return [r['bin'] for r in result.data]
    except Exception as e:
        log.error(f'Failed to get BINs from DB: {e}')
        return []


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        # Парсим конкретные БИН из аргументов
        bins = sys.argv[1:]
        log.info(f'Scraping {len(bins)} specific BINs')
        run_batch_scrape(bins)
    else:
        # Обновляем устаревшие записи
        log.info('Starting incremental update...')
        bins = get_bins_to_update(limit=500)
        if bins:
            run_batch_scrape(bins)
        else:
            log.info('No companies to update')
