import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { DollarSign, MapPin, TrendingUp, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Зарплаты в Казахстане — Lookout',
  description: 'Реальные зарплаты сотрудников казахстанских компаний. Узнайте сколько платят в IT, банках, ритейле.',
}

// Форматирование суммы
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₸`
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс ₸`
  return `${n} ₸`
}

export default async function SalariesPage() {
  const supabase = createClient()

  // Зарплаты с данными компаний
  const { data: salaries } = await supabase
    .from('salaries')
    .select('*, companies(name_ru, bin, city, industry_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(100)

  const items = salaries || []

  // Топ позиций по средней зарплате
  const byPosition: Record<string, number[]> = {}
  items.forEach(s => {
    const key = s.position_category || 'Другое'
    if (!byPosition[key]) byPosition[key] = []
    byPosition[key].push(s.salary_monthly)
  })

  const topPositions = Object.entries(byPosition)
    .map(([cat, salaries]) => ({
      cat,
      avg: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6)

  // Средняя по рынку
  const marketAvg = items.length
    ? Math.round(items.reduce((a, s) => a + s.salary_monthly, 0) / items.length)
    : 0

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Зарплаты в Казахстане</h1>
              <p className="text-gray-500">
                {items.length > 0
                  ? `${items.length} реальных зарплат от сотрудников · средняя ${fmt(marketAvg)}/мес`
                  : 'Будьте первым кто поделится зарплатой'
                }
              </p>
            </div>
            <Link href="/salaries/add"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" /> Добавить зарплату
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-4">

            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Зарплат пока нет</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Станьте первым кто поделится информацией о зарплатах. Это анонимно.
                </p>
                <Link href="/salaries/add"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                  Добавить зарплату
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-gray-900">Последние добавленные</h2>
                {items.map(s => (
                  <SalaryCard key={s.id} salary={s} />
                ))}
              </>
            )}
          </div>

          {/* Сайдбар */}
          <div className="space-y-4">

            {/* Средние по категориям */}
            {topPositions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">По направлениям</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {topPositions.map(({ cat, avg, count }) => (
                    <div key={cat} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{cat}</span>
                        <span className="text-sm font-semibold text-gray-900">{fmt(avg)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{count} {count === 1 ? 'зарплата' : 'зарплат'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-1.5">Поделитесь зарплатой</h4>
              <p className="text-xs text-blue-700 mb-3 leading-relaxed">
                Анонимно. Помогите другим узнать рыночный уровень и принять правильное карьерное решение.
              </p>
              <Link href="/salaries/add"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900">
                Добавить зарплату →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SalaryCard({ salary }: { salary: any }) {
  const company = salary.companies
  const levelLabels: Record<string, string> = {
    intern: 'Стажёр', junior: 'Junior', middle: 'Middle',
    senior: 'Senior', lead: 'Lead', manager: 'Менеджер', director: 'Директор'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Должность */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900">{salary.position_title}</h3>
            {salary.experience_level && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                {levelLabels[salary.experience_level] || salary.experience_level}
              </span>
            )}
          </div>

          {/* Компания */}
          {company && (
            <Link href={`/company/${company.bin}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              {company.name_ru}
            </Link>
          )}

          {/* Мета */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            {salary.position_category && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />{salary.position_category}
              </span>
            )}
            {salary.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{salary.city}
              </span>
            )}
            {salary.year && <span>{salary.year} год</span>}
          </div>
        </div>

        {/* Зарплата */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-gray-900">
            {fmt(salary.salary_monthly)}
            <span className="text-xs font-normal text-gray-400">/мес</span>
          </div>
          {salary.salary_net && (
            <div className="text-xs text-gray-400 mt-0.5">
              {fmt(salary.salary_net)} на руки
            </div>
          )}
          {salary.bonus_annual && (
            <div className="text-xs text-emerald-600 mt-0.5">
              + {fmt(salary.bonus_annual)}/год бонус
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
