'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star, Building2, MapPin, Calendar, Briefcase,
  TrendingUp, TrendingDown, ThumbsUp, ThumbsDown,
  Minus, CheckCircle2, ChevronRight, BadgeCheck,
  Users, DollarSign, AlertTriangle, Scale
} from 'lucide-react'
import { formatDate, formatBin, getStatusLabel, getStatusColor, formatMoney, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Company, CourtCase, TaxRecord, EmployeeReview, CounterpartyReview } from '@/types'

interface Props {
  company: Company
  courtCases: CourtCase[]
  taxRecords: TaxRecord[]
  empReviews: EmployeeReview[]
  cptyReviews: CounterpartyReview[]
  responsesByReview?: Record<string, any>
}

type Tab = 'overview' | 'reviews' | 'interviews' | 'salaries' | 'jobs'

const RATING_LABELS = ['','Очень плохо','Плохо','Нормально','Хорошо','Отлично']

export function CompanyPageClient({ company, courtCases, taxRecords, empReviews, cptyReviews, responsesByReview = {} }: Props) {
  const [tab, setTab] = useState<Tab>('reviews')

  const avg = company.avg_rating
  const totalReviews = empReviews.length

  // Процент рекомендуют
  const recommendCount = empReviews.filter((r: any) => r.recommend === true).length
  const recommendPct = totalReviews > 0 ? Math.round(recommendCount / totalReviews * 100) : 0

  // CEO approval
  const ceoPos = empReviews.filter((r: any) => r.ceo_approval === 'positive').length
  const ceoPct = totalReviews > 0 ? Math.round(ceoPos / totalReviews * 100) : 0

  const tabs = [
    { id: 'reviews' as Tab, label: 'Отзывы', count: totalReviews },
    { id: 'interviews' as Tab, label: 'Интервью', count: null },
    { id: 'salaries' as Tab, label: 'Зарплаты', count: 0 },
    { id: 'jobs' as Tab, label: 'Вакансии', count: null },
    { id: 'overview' as Tab, label: 'Обзор', count: null },
  ]

  return (
    <div className="bg-white min-h-screen">

      {/* ─── Шапка — Glassdoor стиль ──────────────────── */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">

            {/* Лого */}
            <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-9 h-9 text-gray-400" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Название */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{company.name_ru}</h1>
                {company.is_claimed && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" /> Верифицирован
                  </span>
                )}
              </div>

              {/* Рейтинг — как у Glassdoor */}
              {avg && totalReviews > 0 && (
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{totalReviews} {totalReviews === 1 ? 'отзыв' : 'отзывов'}</span>
                </div>
              )}

              {/* Мета */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                {company.legal_form && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{company.legal_form}</span>}
                {company.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{company.city}</span>}
                {company.registration_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    С {new Date(company.registration_date).getFullYear()} года
                  </span>
                )}
                {company.industry_name && <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{company.industry_name}</span>}
              </div>

              {/* Glassdoor-метрики */}
              {totalReviews > 0 && (
                <div className="flex gap-4 flex-wrap">
                  <Metric
                    pct={recommendPct}
                    label="рекомендуют другу"
                    positive={recommendPct >= 70}
                  />
                  {ceoPct > 0 && (
                    <Metric
                      pct={ceoPct}
                      label="одобряют руководство"
                      positive={ceoPct >= 70}
                    />
                  )}
                </div>
              )}
            </div>

            {/* CTA */}
            <Link href={`/reviews/add?company=${company.id}`}
              className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0">
              Оставить отзыв
            </Link>
          </div>

          {/* Предупреждения */}
          {(company.has_tax_debt || company.active_cases_count > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {company.has_tax_debt && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Налоговая задолженность
                </div>
              )}
              {company.active_cases_count > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Scale className="w-3.5 h-3.5" />
                  {company.active_cases_count} активных судов
                </div>
              )}
            </div>
          )}
        </div>

        {/* Вкладки */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Контент ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            {tab === 'reviews' && <ReviewsTab reviews={empReviews} companyId={company.id} companyName={company.name_ru} responsesByReview={responsesByReview} />}
            {tab === 'interviews' && <InterviewsTab companyId={company.id} />}
            {tab === 'salaries' && <SalariesTab companyId={company.id} salaries={[]} />}
            {tab === 'jobs' && <JobsTab companyId={company.id} companyName={company.name_ru} />}
            {tab === 'overview' && <OverviewTab company={company} taxRecords={taxRecords} />}
          </div>

          {/* Сайдбар */}
          <div className="space-y-4">
            <SidebarInfo company={company} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Метрика (% рекомендуют) ──────────────────────────────
function Metric({ pct, label, positive }: { pct: number; label: string; positive: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

// ─── Вкладка Отзывы ──────────────────────────────────────
function ReviewsTab({ reviews, companyId, companyName, responsesByReview }: { reviews: any[]; companyId: string; companyName: string; responsesByReview: Record<string, any> }) {
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating_overall, 0) / reviews.length : 0

  const subRatings = [
    { key: 'rating_worklife', label: 'Баланс работы и жизни' },
    { key: 'rating_culture', label: 'Культура компании' },
    { key: 'rating_management', label: 'Руководство' },
    { key: 'rating_compensation', label: 'Зарплата и льготы' },
    { key: 'rating_career', label: 'Карьерный рост' },
  ]

  return (
    <div className="space-y-5">

      {reviews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-8 flex-wrap">
            {/* Общий рейтинг */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</div>
              <div className="flex justify-center my-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <div className="text-xs text-gray-400">{reviews.length} отзывов</div>
            </div>

            {/* Распределение по звёздам */}
            <div className="flex-1 min-w-48 space-y-1.5">
              {[5,4,3,2,1].map(s => {
                const count = reviews.filter(r => r.rating_overall === s).length
                const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{s}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Субрейтинги */}
            <div className="flex-1 min-w-48 space-y-2">
              {subRatings.map(({ key, label }) => {
                const vals = reviews.map((r: any) => r[key]).filter(Boolean)
                if (!vals.length) return null
                const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length
                return (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 flex-1">{label}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${avg / 5 * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-6">{avg.toFixed(1)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка добавить */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {reviews.length > 0 ? `${reviews.length} отзывов` : 'Отзывов пока нет'}
        </h2>
        <Link href={`/reviews/add?company=${companyId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800">
          + Написать отзыв
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Будьте первым кто напишет отзыв об этом работодателе</p>
          <Link href={`/reviews/add?company=${companyId}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Написать отзыв
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => <ReviewCard key={r.id} review={r} companyId={companyId} companyName={companyName} existingResponse={responsesByReview[r.id]} />)}
        </div>
      )}
    </div>
  )
}

// ─── Карточка отзыва — Glassdoor стиль ────────────────────
function ReviewCard({ review, companyId, companyName, existingResponse }: { review: any; companyId: string; companyName: string; existingResponse?: any }) {
  const [expanded, setExpanded] = useState(false)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState(existingResponse?.content || '')
  const [response, setResponse] = useState(existingResponse)
  const [saving, setSaving] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.type === 'business') {
        setIsBusiness(true)
      }
    })
  }, [companyId])

  const submitResponse = async () => {
    if (!responseText.trim()) return
    setSaving(true)
    const res = await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: review.id, company_id: companyId, content: responseText }),
    })
    const data = await res.json()
    if (data.response) {
      setResponse(data.response)
      setShowResponseForm(false)
    }
    setSaving(false)
  }

  const subRatings = [
    { key: 'rating_worklife', label: 'Баланс' },
    { key: 'rating_culture', label: 'Культура' },
    { key: 'rating_management', label: 'Руководство' },
    { key: 'rating_compensation', label: 'Зарплата' },
    { key: 'rating_career', label: 'Карьера' },
  ].filter(({ key }) => review[key])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= review.rating_overall ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-sm font-bold text-gray-800">{review.rating_overall}/5</span>
          </div>
          <h3 className="font-semibold text-gray-900">{review.title}</h3>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(review.created_at)}</span>
      </div>

      {/* Мета */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-400">
        {review.is_current_employee !== null && (
          <span>{review.is_current_employee ? '✓ Работает сейчас' : '✓ Бывший сотрудник'}</span>
        )}
        {review.position_category && <span>{review.position_category}</span>}
        {review.employment_year_start && <span>{review.employment_year_start}{review.employment_year_end ? `–${review.employment_year_end}` : '–н.в.'}</span>}
      </div>

      {/* Плюсы и минусы */}
      <div className="space-y-3 mb-4">
        {review.pros && (
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Плюсы</div>
            <p className={`text-sm text-gray-700 leading-relaxed ${!expanded && review.pros.length > 200 ? 'line-clamp-3' : ''}`}>{review.pros}</p>
          </div>
        )}
        {review.cons && (
          <div>
            <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Минусы</div>
            <p className={`text-sm text-gray-700 leading-relaxed ${!expanded && review.cons.length > 200 ? 'line-clamp-3' : ''}`}>{review.cons}</p>
          </div>
        )}
        {review.advice_to_management && (
          <div>
            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Совет руководству</div>
            <p className="text-sm text-gray-700 leading-relaxed">{review.advice_to_management}</p>
          </div>
        )}
      </div>

      {/* Субрейтинги */}
      {subRatings.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          {subRatings.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{label}</span>
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= review[key] ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Рекомендует / CEO / Outlook */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-50">
        {review.recommend !== null && (
          <div className={`flex items-center gap-1.5 text-xs ${review.recommend ? 'text-emerald-600' : 'text-red-500'}`}>
            {review.recommend ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
            {review.recommend ? 'Рекомендует' : 'Не рекомендует'}
          </div>
        )}
        {review.ceo_approval && (
          <div className={`flex items-center gap-1.5 text-xs ${review.ceo_approval === 'positive' ? 'text-emerald-600' : review.ceo_approval === 'negative' ? 'text-red-500' : 'text-gray-400'}`}>
            {review.ceo_approval === 'positive' ? <ThumbsUp className="w-3.5 h-3.5" /> : review.ceo_approval === 'negative' ? <ThumbsDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            {review.ceo_approval === 'positive' ? 'Одобряет руководство' : review.ceo_approval === 'negative' ? 'Не одобряет' : 'Нейтрально'}
          </div>
        )}
        {review.business_outlook && (
          <div className={`flex items-center gap-1.5 text-xs ${review.business_outlook === 'positive' ? 'text-emerald-600' : review.business_outlook === 'negative' ? 'text-red-500' : 'text-gray-400'}`}>
            {review.business_outlook === 'positive' ? <TrendingUp className="w-3.5 h-3.5" /> : review.business_outlook === 'negative' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            {review.business_outlook === 'positive' ? 'Компания растёт' : review.business_outlook === 'negative' ? 'Снижается' : 'Стабильно'}
          </div>
        )}
        {/* Кнопка ответить для работодателя */}
        {isBusiness && !response && !showResponseForm && (
          <button onClick={() => setShowResponseForm(true)}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium">
            Ответить
          </button>
        )}
      </div>

      {/* Форма ответа */}
      {isBusiness && showResponseForm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ответ от {companyName}</div>
          <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
            rows={3} placeholder="Напишите официальный ответ на отзыв..."
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none mb-2" />
          <div className="flex gap-2">
            <button onClick={submitResponse} disabled={saving || !responseText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {saving ? 'Сохраняем...' : 'Опубликовать ответ'}
            </button>
            <button onClick={() => setShowResponseForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Ответ работодателя — Glassdoor стиль */}
      {response && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs font-semibold text-blue-900">Официальный ответ от {companyName}</div>
              <div className="text-xs text-blue-400 ml-auto">{timeAgo(response.created_at)}</div>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">{response.content}</p>
            {isBusiness && (
              <button onClick={() => { setShowResponseForm(true); setResponseText(response.content) }}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2">
                Изменить ответ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Вкладка Зарплаты ─────────────────────────────────────
function SalariesTab({ companyId, salaries }: { companyId: string; salaries: any[] }) {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₸`
    if (n >= 1_000) return `${Math.round(n / 1_000)} тыс ₸`
    return `${n} ₸`
  }

  const levelLabels: Record<string, string> = {
    intern: 'Стажёр', junior: 'Junior', middle: 'Middle',
    senior: 'Senior', lead: 'Lead', manager: 'Менеджер', director: 'Директор'
  }

  // Группировка по категории
  const byCategory: Record<string, number[]> = {}
  salaries.forEach(s => {
    const key = s.position_category || 'Другое'
    if (!byCategory[key]) byCategory[key] = []
    byCategory[key].push(s.salary_monthly)
  })

  const categoryStats = Object.entries(byCategory).map(([cat, vals]) => ({
    cat,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length,
  })).sort((a, b) => b.avg - a.avg)

  const overallAvg = salaries.length
    ? Math.round(salaries.reduce((a, s) => a + s.salary_monthly, 0) / salaries.length)
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Зарплаты {salaries.length > 0 && <span className="text-gray-400 font-normal">({salaries.length})</span>}
        </h2>
        <Link href={`/salaries/add?company=${companyId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800">
          + Добавить зарплату
        </Link>
      </div>

      {salaries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Зарплат пока нет</h3>
          <p className="text-sm text-gray-400 mb-4">Поделитесь анонимно — помогите другим узнать рыночный уровень</p>
          <Link href={`/salaries/add?company=${companyId}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
            Добавить зарплату
          </Link>
        </div>
      ) : (
        <>
          {/* Средняя по компании */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="text-sm text-blue-600 font-medium mb-1">Средняя зарплата</div>
            <div className="text-3xl font-bold text-gray-900">{fmt(overallAvg)}<span className="text-base font-normal text-gray-400">/мес</span></div>
            <div className="text-xs text-gray-400 mt-1">на основе {salaries.length} {salaries.length === 1 ? 'зарплаты' : 'зарплат'}</div>
          </div>

          {/* По категориям */}
          {categoryStats.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 font-semibold text-sm text-gray-900">По направлениям</div>
              {categoryStats.map(({ cat, avg, min, max, count }) => (
                <div key={cat} className="px-5 py-3.5 border-b border-gray-50 last:border-none">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{cat}</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(avg)}/мес</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(avg / Math.max(...categoryStats.map(c => c.max))) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{count} {count === 1 ? 'чел.' : 'чел.'}</span>
                  </div>
                  {min !== max && (
                    <div className="text-xs text-gray-400 mt-0.5">{fmt(min)} — {fmt(max)}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Список */}
          <div className="space-y-3">
            {salaries.map(s => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-gray-900">{s.position_title}</span>
                      {s.experience_level && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {levelLabels[s.experience_level] || s.experience_level}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      {s.city && <span>{s.city}</span>}
                      {s.year && <span>{s.year}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-gray-900">{fmt(s.salary_monthly)}<span className="text-xs font-normal text-gray-400">/мес</span></div>
                    {s.bonus_annual && <div className="text-xs text-emerald-600">+{fmt(s.bonus_annual)} бонус</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Вкладка Суды ─────────────────────────────────────────
function CourtsTab({ cases, total }: { cases: CourtCase[]; total: number }) {
  if (cases.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Судебных дел не найдено</h3>
        <p className="text-sm text-gray-400">Данная компания не фигурирует в судебных реестрах</p>
      </div>
    )
  }

  const typeMap: Record<string, string> = {
    civil: 'Гражданское', tax: 'Налоговое', criminal: 'Уголовное',
    administrative: 'Административное', bankruptcy: 'Банкротство'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Судебные дела <span className="text-gray-400 font-normal">({total})</span></h2>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {cases.map((c, i) => (
          <div key={c.id} className={`px-5 py-4 ${i < cases.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.case_status === 'active' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.case_status === 'active' ? 'Активное' : 'Завершено'}
                  </span>
                  {c.case_type && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{typeMap[c.case_type] || c.case_type}</span>}
                  {c.role && <span className="text-xs text-gray-400">{c.role === 'defendant' ? 'Ответчик' : 'Истец'}</span>}
                </div>
                <div className="text-sm text-gray-700">
                  {c.case_number && <span className="font-medium">№ {c.case_number}</span>}
                  {c.court_name && <span className="text-gray-400"> · {c.court_name}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {c.amount && <div className="text-sm font-semibold text-gray-800">{formatMoney(c.amount)}</div>}
                <div className="text-xs text-gray-400">{formatDate(c.case_date)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Вкладка Обзор ────────────────────────────────────────
function OverviewTab({ company, taxRecords }: { company: Company; taxRecords: TaxRecord[] }) {
  const fields = [
    { label: 'БИН', value: formatBin(company.bin) },
    { label: 'Правовая форма', value: company.legal_form },
    { label: 'Дата регистрации', value: formatDate(company.registration_date) },
    { label: 'Отрасль', value: company.industry_name },
    { label: 'Регион', value: company.region },
    { label: 'Город', value: company.city },
    { label: 'Адрес', value: company.address },
    { label: 'Директор', value: company.director_name },
    { label: 'Уставной капитал', value: formatMoney(company.charter_capital) },
  ].filter(f => f.value && f.value !== '—')

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Сведения о компании</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {fields.map(f => (
          <div key={f.label} className="px-5 py-3.5">
            <div className="text-xs text-gray-400 mb-0.5">{f.label}</div>
            <div className="text-sm text-gray-800 font-medium">{f.value}</div>
          </div>
        ))}
      </div>
      {taxRecords.filter(r => r.is_active).length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4 bg-red-50">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Налоговые ограничения</div>
          {taxRecords.filter(r => r.is_active).map(r => (
            <p key={r.id} className="text-sm text-red-700">{r.description || r.record_type}{r.amount ? ` · ${formatMoney(r.amount)}` : ''}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Сайдбар ──────────────────────────────────────────────
function SidebarInfo({ company }: { company: Company }) {
  const age = company.registration_date
    ? Math.floor((Date.now() - new Date(company.registration_date).getTime()) / 31536000000)
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">О компании</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {company.industry_name && (
          <div className="px-5 py-3">
            <div className="text-xs text-gray-400 mb-0.5">Отрасль</div>
            <div className="text-sm text-gray-800">{company.industry_name}</div>
          </div>
        )}
        {company.city && (
          <div className="px-5 py-3">
            <div className="text-xs text-gray-400 mb-0.5">Расположение</div>
            <div className="text-sm text-gray-800">{company.city}{company.region ? `, ${company.region}` : ''}</div>
          </div>
        )}
        {age !== null && (
          <div className="px-5 py-3">
            <div className="text-xs text-gray-400 mb-0.5">На рынке</div>
            <div className="text-sm text-gray-800">{age} {age === 1 ? 'год' : age < 5 ? 'года' : 'лет'}</div>
          </div>
        )}
        <div className="px-5 py-3">
          <div className="text-xs text-gray-400 mb-0.5">БИН</div>
          <div className="text-sm text-gray-800 font-mono">{formatBin(company.bin)}</div>
        </div>
        <div className="px-5 py-3">
          <div className="text-xs text-gray-400 mb-0.5">Статус</div>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getStatusColor(company.status)}`}>
            {company.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {getStatusLabel(company.status)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Вкладка Вакансии ─────────────────────────────────────
function JobsTab({ companyId, companyName }: { companyId: string; companyName: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Вакансии</h2>
        <Link href={`/jobs/add`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800">
          + Разместить вакансию
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Вакансий пока нет</h3>
        <p className="text-sm text-gray-400 mb-4">
          Разместите вакансию рядом с отзывами о компании — соискатели увидят её в контексте
        </p>
        <Link href="/jobs/add"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          Разместить вакансию
        </Link>
      </div>
    </div>
  )
}

// ─── Вкладка Интервью ─────────────────────────────────────
function InterviewsTab({ companyId }: { companyId: string }) {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    createClient()
      .from('reviews_interview')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInterviews(data || []); setLoaded(true) })
  }, [companyId])

  const expLabels: Record<string, string> = { positive: '👍 Позитивное', neutral: '😐 Нейтральное', negative: '👎 Негативное' }
  const diffLabels: Record<string, string> = { easy: 'Лёгкое', average: 'Среднее', difficult: 'Сложное' }
  const offerLabels: Record<string, string> = { yes: 'Получил оффер', no: 'Не предложили', declined: 'Отказался' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Отзывы об интервью {interviews.length > 0 && <span className="text-gray-400 font-normal">({interviews.length})</span>}
        </h2>
        <Link href={`/interviews/add?company=${companyId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          + Написать отзыв
        </Link>
      </div>

      {!loaded ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Загружаем...</div>
      ) : interviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Отзывов об интервью пока нет</h3>
          <p className="text-sm text-gray-400 mb-4">Поделитесь опытом прохождения интервью</p>
          <Link href={`/interviews/add?company=${companyId}`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
            Написать отзыв
          </Link>
        </div>
      ) : (
        interviews.map((iv: any) => (
          <div key={iv.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{iv.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {iv.experience && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{expLabels[iv.experience]}</span>}
                  {iv.difficulty && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Сложность: {diffLabels[iv.difficulty]}</span>}
                  {iv.offer_received && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offerLabels[iv.offer_received]}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex justify-end mb-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= iv.rating_overall ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
                </div>
                <div className="text-xs text-gray-400">{timeAgo(iv.created_at)}</div>
              </div>
            </div>
            {iv.description && <p className="text-sm text-gray-700 mb-3 leading-relaxed">{iv.description}</p>}
            {iv.questions && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Вопросы</div>
                <p className="text-sm text-gray-700 leading-relaxed">{iv.questions}</p>
              </div>
            )}
            {iv.position_title && <div className="text-xs text-gray-400 mt-2">{iv.position_title}{iv.duration_weeks ? ` · ${iv.duration_weeks} нед.` : ''}</div>}
          </div>
        ))
      )}
    </div>
  )
}
