import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const KGD_HOST  = 'https://portal.kgd.gov.kz'
const KGD_URL   = `${KGD_HOST}/services/isnaportalsync/public/taxpayer-data`
const CACHE_DAYS = 7  // Обновлять данные если старше 7 дней

// ─── Главный обработчик ───────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { bin: string } }
) {
  const bin = params.bin?.trim()

  // Валидация БИН
  if (!bin || bin.length !== 12 || !/^\d+$/.test(bin)) {
    return NextResponse.json({ error: 'Неверный формат БИН' }, { status: 400 })
  }

  const supabase = createClient()

  // ── Шаг 1: Проверяем кэш в Supabase ──────────────────────
  const { data: cached } = await supabase
    .from('companies')
    .select('*, court_cases(*), tax_records(*)')
    .eq('bin', bin)
    .single()

  // Если данные свежие — возвращаем из кэша
  if (cached && cached.last_scraped_at) {
    const age = Date.now() - new Date(cached.last_scraped_at).getTime()
    const ageDays = age / (1000 * 60 * 60 * 24)

    if (ageDays < CACHE_DAYS) {
      return NextResponse.json({
        source: 'cache',
        company: cached
      })
    }
  }

  // ── Шаг 2: Запрашиваем КГД API ───────────────────────────
  const token = process.env.KGD_TOKEN
  if (!token) {
    // Нет токена — возвращаем что есть в кэше (даже если старое)
    if (cached) {
      return NextResponse.json({ source: 'cache_stale', company: cached })
    }
    return NextResponse.json(
      { error: 'Сервис временно недоступен' },
      { status: 503 }
    )
  }

  try {
    const kgdResponse = await fetch(
      `${KGD_URL}?taxpayerCode=${bin}&taxpayerType=UL&print=false`,
      {
        headers: {
          'X-Portal-Token': token,
          'Accept': 'application/json',
        },
        next: { revalidate: 0 }, // Не кэшировать fetch
      }
    )

    if (!kgdResponse.ok) {
      // КГД недоступен — отдаём кэш если есть
      if (cached) {
        return NextResponse.json({ source: 'cache_stale', company: cached })
      }
      return NextResponse.json(
        { error: 'Данные временно недоступны' },
        { status: 503 }
      )
    }

    const kgdData = await kgdResponse.json()
    const responses = kgdData?.taxpayerPortalSearchResponses || []

    if (!responses.length || responses[0]?.messageResult !== 'SUCCESS') {
      // Компания не найдена в КГД
      return NextResponse.json(
        { error: 'Компания не найдена', bin },
        { status: 404 }
      )
    }

    // ── Шаг 3: Парсим ответ КГД ───────────────────────────
    const item = responses[0]
    const isLiquidated = !!item.endDate

    const companyData = {
      bin,
      name_ru: item.name || `Компания ${bin}`,
      status: isLiquidated ? 'liquidated' : 'active' as any,
      registration_date: item.beginDate || null,
      legal_form: item.registrationType?.ru || null,
      last_scraped_at: new Date().toISOString(),
      slug: generateSlug(item.name || bin, bin),
    }

    // ── Шаг 4: Сохраняем в Supabase ──────────────────────
    const { data: saved } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'bin' })
      .select('*')
      .single()

    return NextResponse.json({
      source: 'live',  // Данные только что с КГД
      company: saved || companyData,
    })

  } catch (err) {
    console.error('KGD API error:', err)

    // Сеть недоступна — отдаём кэш
    if (cached) {
      return NextResponse.json({ source: 'cache_stale', company: cached })
    }

    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    )
  }
}

// ─── Вспомогательная функция ─────────────────────────────
function generateSlug(name?: string, bin?: string): string {
  const safeName = (name ?? '').toLowerCase()

  const slug = safeName
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',
        и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',
        с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',
        щ:'sch',ы:'y',э:'e',ю:'yu',я:'ya',
      }
      return map[char] || char
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const safeBin = bin ?? ''
  return `${slug || 'company'}-${safeBin.slice(-6)}`
}