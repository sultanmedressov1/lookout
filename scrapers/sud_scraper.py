"""
TrustLink — Скрапер судебных дел с Sud.kz
Запуск: python scrapers/sud_scraper.py <БИН>

Требования: pip install playwright supabase python-dotenv
Установка браузера: playwright install chromium
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
SUD_KZ_BASE = 'https://sud.kz'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def scrape_court_cases(bin_code: str, company_id: str) -> list[dict]:
    """Парсит судебные дела компании с sud.kz"""
    from playwright.async_api import async_playwright

    cases = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()

        try:
            # Sud.kz поиск по БИН
            url = f'{SUD_KZ_BASE}/ru/search?bin={bin_code}'
            log.info(f'Navigating to {url}')

            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)  # Ждём загрузку динамического контента

            # Ищем строки с делами в таблице
            rows = await page.query_selector_all('table.cases-table tr, .case-row, [data-case-id]')

            for row in rows[:50]:  # Максимум 50 дел
                try:
                    case_data = await extract_case_from_row(row, company_id)
                    if case_data:
                        cases.append(case_data)
                except Exception as e:
                    log.warning(f'Failed to parse row: {e}')
                    continue

            log.info(f'Found {len(cases)} court cases for BIN {bin_code}')

        except Exception as e:
            log.error(f'Error scraping sud.kz for BIN {bin_code}: {e}')
        finally:
            await browser.close()

    return cases


async def extract_case_from_row(row, company_id: str) -> Optional[dict]:
    """Извлекает данные дела из строки таблицы"""
    try:
        # Адаптируй селекторы под реальную структуру sud.kz
        case_number = await row.query_selector('.case-number, td:nth-child(1)')
        case_date_el = await row.query_selector('.case-date, td:nth-child(2)')
        case_type_el = await row.query_selector('.case-type, td:nth-child(3)')
        case_status_el = await row.query_selector('.case-status, td:nth-child(4)')

        case_number_text = await case_number.inner_text() if case_number else None
        case_date_text = await case_date_el.inner_text() if case_date_el else None
        case_type_text = await case_type_el.inner_text() if case_type_el else None
        case_status_text = await case_status_el.inner_text() if case_status_el else None

        if not case_number_text:
            return None

        return {
            'company_id': company_id,
            'case_number': case_number_text.strip(),
            'case_date': parse_date(case_date_text),
            'case_type': map_case_type(case_type_text),
            'case_status': map_case_status(case_status_text),
            'scraped_at': datetime.utcnow().isoformat(),
        }
    except Exception:
        return None


def map_case_type(type_str: Optional[str]) -> Optional[str]:
    if not type_str:
        return None
    type_lower = type_str.lower()
    if 'гражд' in type_lower:
        return 'civil'
    if 'налог' in type_lower or 'администр' in type_lower:
        return 'tax'
    if 'уголов' in type_lower:
        return 'criminal'
    if 'банкрот' in type_lower:
        return 'bankruptcy'
    return 'administrative'


def map_case_status(status_str: Optional[str]) -> Optional[str]:
    if not status_str:
        return None
    status_lower = status_str.lower()
    if 'рассматр' in status_lower or 'активн' in status_lower:
        return 'active'
    if 'завершен' in status_lower or 'вступил' in status_lower:
        return 'completed'
    if 'апелляц' in status_lower:
        return 'appeal'
    if 'исполнен' in status_lower:
        return 'enforcement'
    return 'completed'


def parse_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in ('%d.%m.%Y', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            from datetime import datetime as dt
            return dt.strptime(date_str, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def save_court_cases(cases: list[dict], company_id: str) -> int:
    """Сохраняет судебные дела в Supabase"""
    if not cases:
        return 0

    try:
        # Удаляем старые данные для этой компании
        supabase.table('court_cases').delete().eq('company_id', company_id).execute()

        # Вставляем новые
        result = supabase.table('court_cases').insert(cases).execute()
        count = len(result.data)

        # Пересчитываем метрики компании
        supabase.rpc('recalculate_company_metrics', {'p_company_id': company_id}).execute()

        return count
    except Exception as e:
        log.error(f'Failed to save court cases: {e}')
        return 0


def get_company_id_by_bin(bin_code: str) -> Optional[str]:
    """Получает ID компании по БИН"""
    try:
        result = supabase.table('companies').select('id').eq('bin', bin_code).single().execute()
        return result.data['id'] if result.data else None
    except Exception:
        return None


async def run(bin_code: str):
    log.info(f'Starting court cases scrape for BIN: {bin_code}')

    company_id = get_company_id_by_bin(bin_code)
    if not company_id:
        log.error(f'Company not found in DB for BIN: {bin_code}. Run egov_scraper.py first.')
        return

    cases = await scrape_court_cases(bin_code, company_id)

    if cases:
        saved = save_court_cases(cases, company_id)
        log.info(f'Saved {saved} court cases for BIN {bin_code}')
    else:
        log.info(f'No court cases found for BIN {bin_code}')


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage: python sud_scraper.py <БИН>')
        print('Example: python sud_scraper.py 050340009739')
        sys.exit(1)

    bin_code = sys.argv[1]
    asyncio.run(run(bin_code))
