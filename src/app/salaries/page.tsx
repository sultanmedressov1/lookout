import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { DollarSign, MapPin, TrendingUp, Plus, BarChart2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Зарплаты в Казахстане — Lookout' }

interface PageProps { searchParams: { category?: string; city?: string; level?: string } }

const CATEGORIES = ['IT и разработка','Менеджмент','Продажи','Маркетинг','Финансы','HR','Операции','Дизайн','Аналитика']
const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар']
const LEVELS = [['intern','Стажёр'],['junior','Junior'],['middle','Middle'],['senior','Senior'],['lead','Lead'],['manager','Менеджер']]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн ₸`
  if (n >= 1_000) return `${Math.round(n/1_000)} тыс ₸`
  return `${n} ₸`
}

export default async function SalariesPage({ searchParams }: PageProps) {
  const supabase = createClient()

  let query = supabase.from('salaries')
    .select('*, companies(name_ru, slug, city)')
    .eq('is_published', true).order('created_at', { ascending: false }).limit(200)

  if (searchParams.category) query = query.eq('position_category', searchParams.category)
  if (searchParams.city) query = query.eq('city', searchParams.city)
  if (searchParams.level) query = query.eq('experience_level', searchParams.level)

  const { data: salaries } = await query
  const items = salaries || []

  const marketAvg = items.length ? Math.round(items.reduce((a, s) => a + s.salary_monthly, 0) / items.length) : 0

  // По категориям
  const byCategory: Record<string, number[]> = {}
  items.forEach(s => {
    const k = s.position_category || 'Другое'
    if (!byCategory[k]) byCategory[k] = []
    byCategory[k].push(s.salary_monthly)
  })
  const categoryStats = Object.entries(byCategory)
    .map(([cat, vals]) => ({ cat, avg: Math.round(vals.reduce((a,b) => a+b,0)/vals.length), count: vals.length }))
    .sort((a,b) => b.avg - a.avg).slice(0, 8)
  const maxCatAvg = Math.max(...categoryStats.map(c => c.avg), 1)

  // По городам
  const byCity: Record<string, number[]> = {}
  items.forEach(s => {
    if (!s.city) return
    if (!byCity[s.city]) byCity[s.city] = []
    byCity[s.city].push(s.salary_monthly)
  })
  const cityStats = Object.entries(byCity)
    .map(([city, vals]) => ({ city, avg: Math.round(vals.reduce((a,b) => a+b,0)/vals.length), count: vals.length }))
    .sort((a,b) => b.avg - a.avg).slice(0, 6)
  const maxCityAvg = Math.max(...cityStats.map(c => c.avg), 1)

  const levelLabels: Record<string, string> = { intern:'Стажёр', junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', manager:'Менеджер', director:'Директор' }

  const hasFilters = searchParams.category || searchParams.city || searchParams.level

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Зарплаты в Казахстане</h1>
              <p className="text-gray-500 text-sm">
                {items.length > 0 ? `${items.length} реальных зарплат · средняя ${fmt(marketAvg)}/мес` : 'Будьте первым кто поделится'}
              </p>
            </div>
            <Link href="/salaries/add" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Добавить зарплату
            </Link>
          </div>

          {/* Фильтры */}
          <form method="GET" className="flex flex-wrap gap-2 items-center">
            <select name="category" defaultValue={searchParams.category}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
              <option value="">Все направления</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="city" defaultValue={searchParams.city}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
              <option value="">Все города</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="level" defaultValue={searchParams.level}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
              <option value="">Все уровни</option>
              {LEVELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Применить
            </button>
            {hasFilters && <Link href="/salaries" className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">Сбросить</Link>}
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Список */}
            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">Нет данных по выбранным фильтрам</p>
                <Link href="/salaries/add" className="text-sm text-blue-600 hover:text-blue-800">Добавить зарплату →</Link>
              </div>
            ) : (
              items.slice(0, 50).map(s => {
                const company = (s as any).companies
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{s.position_title}</h3>
                          {s.experience_level && (
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                              {levelLabels[s.experience_level] || s.experience_level}
                            </span>
                          )}
                        </div>
                        {company && (
                          <Link href={`/company/${company.slug}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            {company.name_ru}
                          </Link>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                          {s.position_category && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.position_category}</span>}
                          {s.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</span>}
                          {s.year && <span>{s.year}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900">{fmt(s.salary_monthly)}<span className="text-xs font-normal text-gray-400">/мес</span></div>
                        {s.salary_net && <div className="text-xs text-gray-400">{fmt(s.salary_net)} на руки</div>}
                        {s.bonus_annual && <div className="text-xs text-emerald-600">+{fmt(s.bonus_annual)} бонус/год</div>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Инфографика */}
          <div className="space-y-4">

            {/* По направлениям */}
            {categoryStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 text-sm">По направлениям</h3>
                </div>
                <div className="p-4 space-y-3">
                  {categoryStats.map(({ cat, avg, count }) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 truncate flex-1 mr-2">{cat}</span>
                        <span className="text-xs font-semibold text-gray-900 flex-shrink-0">{fmt(avg)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(avg / maxCatAvg) * 100}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{count} {count===1?'зарплата':'зарплат'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* По городам */}
            {cityStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 text-sm">По городам</h3>
                </div>
                <div className="p-4 space-y-3">
                  {cityStats.map(({ city, avg, count }) => (
                    <div key={city}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{city}</span>
                        <span className="text-xs font-semibold text-gray-900">{fmt(avg)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(avg / maxCityAvg) * 100}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{count} {count===1?'зарплата':'зарплат'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-1.5">Поделитесь зарплатой</h4>
              <p className="text-xs text-blue-700 mb-3 leading-relaxed">Анонимно. Помогите другим знать рыночный уровень.</p>
              <Link href="/salaries/add" className="text-sm font-medium text-blue-700 hover:text-blue-900">
                Добавить зарплату →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
