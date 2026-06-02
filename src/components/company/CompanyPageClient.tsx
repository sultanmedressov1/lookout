'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, MapPin, Calendar, Users, Scale,
  ShieldCheck, AlertTriangle, ExternalLink,
  Star, ThumbsUp, CheckCircle2, Clock, ChevronRight,
  Briefcase, TrendingUp, BadgeCheck
} from 'lucide-react'
import { formatDate, formatMoney, formatBin, getStatusLabel, getStatusColor, timeAgo } from '@/lib/utils'
import type { Company, CourtCase, TaxRecord, EmployeeReview, CounterpartyReview } from '@/types'

interface Props {
  company: Company
  courtCases: CourtCase[]
  taxRecords: TaxRecord[]
  empReviews: EmployeeReview[]
  cptyReviews: CounterpartyReview[]
}

type Tab = 'overview' | 'courts' | 'employees' | 'counterparty'

export function CompanyPageClient({ company, courtCases, taxRecords, empReviews, cptyReviews }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const tabs = [
    { id: 'overview' as Tab, label: 'Обзор' },
    { id: 'courts' as Tab, label: 'Суды', count: company.court_cases_count },
    { id: 'employees' as Tab, label: 'Сотрудники', count: empReviews.length },
    { id: 'counterparty' as Tab, label: 'Контрагенты', count: cptyReviews.length },
  ]

  const score = company.risk_score
  const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'
  const scoreLabel = score >= 70 ? 'Надёжная' : score >= 40 ? 'Умеренный риск' : 'Высокий риск'
  const scoreBg = score >= 70 ? 'bg-emerald-50 border-emerald-100' : score >= 40 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'

  const companyAge = company.registration_date
    ? Math.floor((Date.now() - new Date(company.registration_date).getTime()) / 31536000000)
    : null

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ─── Шапка компании ──────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6 flex-wrap">

            {/* Лого-заглушка */}
            <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-9 h-9 text-gray-400" />
            </div>

            {/* Основная информация */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{company.name_ru}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(company.status)}`}>
                  {company.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {getStatusLabel(company.status)}
                </span>
                {company.is_claimed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <BadgeCheck className="w-3 h-3" /> Верифицирован
                  </span>
                )}
              </div>

              {company.name_kz && (
                <p className="text-gray-400 text-sm mb-2">{company.name_kz}</p>
              )}

              {/* Мета-строка */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                {company.legal_form && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {company.legal_form}
                  </span>
                )}
                {company.industry_name && (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {company.industry_name}
                  </span>
                )}
                {company.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {company.city}
                  </span>
                )}
                {company.registration_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    С {new Date(company.registration_date).getFullYear()} года
                    {companyAge !== null && ` (${companyAge} лет)`}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  БИН {formatBin(company.bin)}
                </span>
              </div>

              {/* Рейтинг отзывов */}
              {company.avg_rating && company.reviews_count > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(company.avg_rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{company.avg_rating?.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({company.reviews_count} отзывов)</span>
                </div>
              )}
            </div>

            {/* Риск-балл */}
            <div className={`flex flex-col items-center p-4 rounded-xl border ${scoreBg} flex-shrink-0`}>
              <ScoreCircle score={score} color={scoreColor} />
              <span className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>
                {scoreLabel}
              </span>
            </div>
          </div>

          {/* Предупреждения */}
          {(company.has_tax_debt || company.active_cases_count > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {company.has_tax_debt && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Налоговая задолженность: {formatMoney(company.tax_debt_amount)}
                </div>
              )}
              {company.active_cases_count > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Scale className="w-3.5 h-3.5" />
                  Активных судебных дел: {company.active_cases_count}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Вкладки */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Контент вкладок ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Основное */}
          <div className="lg:col-span-2 space-y-5">
            {activeTab === 'overview' && (
              <OverviewTab company={company} taxRecords={taxRecords} courtCases={courtCases} />
            )}
            {activeTab === 'courts' && (
              <CourtsTab courtCases={courtCases} />
            )}
            {activeTab === 'employees' && (
              <ReviewsTab
                type="employee"
                reviews={empReviews}
                companyId={company.id}
                companyName={company.name_ru}
              />
            )}
            {activeTab === 'counterparty' && (
              <ReviewsTab
                type="counterparty"
                reviews={cptyReviews}
                companyId={company.id}
                companyName={company.name_ru}
              />
            )}
          </div>

          {/* Сайдбар */}
          <div className="space-y-4">
            <CompanySidebar company={company} taxRecords={taxRecords} />
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Круговой индикатор скора ────────────────────────────
function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="45" y="45" textAnchor="middle" dy="0.35em"
        fontSize="20" fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

// ─── Вкладка Обзор ───────────────────────────────────────
function OverviewTab({ company, taxRecords, courtCases }: {
  company: Company; taxRecords: TaxRecord[]; courtCases: CourtCase[]
}) {
  const kybFactors = [
    { label: 'Возраст компании', value: company.registration_date
        ? `${Math.floor((Date.now() - new Date(company.registration_date).getTime()) / 31536000000)} лет`
        : '—',
      positive: true },
    { label: 'Судебных дел', value: company.court_cases_count, positive: company.court_cases_count === 0 },
    { label: 'Активных судов', value: company.active_cases_count, positive: company.active_cases_count === 0 },
    { label: 'Налоговый долг', value: company.has_tax_debt ? formatMoney(company.tax_debt_amount) : 'Нет', positive: !company.has_tax_debt },
  ]

  return (
    <div className="space-y-5">

      {/* Разбивка скора */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Риск-балл — из чего складывается</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <ScoreBar label="KYB Score" value={company.kyb_score} color="blue" desc="Официальные данные" />
          <ScoreBar label="TrustRank" value={company.trust_rank_score} color="emerald" desc="Отзывы участников" />
        </div>
        <div className="space-y-2.5">
          {kybFactors.map(f => (
            <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-none">
              <span className="text-sm text-gray-600">{f.label}</span>
              <span className={`text-sm font-medium ${f.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {typeof f.value === 'number' && f.value > 0 && !f.positive ? `⚠ ${f.value}` : `${f.positive ? '✓' : ''} ${f.value}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Последние суды */}
      {courtCases.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Последние судебные дела</h2>
            <span className="text-xs text-gray-400">{company.court_cases_count} всего</span>
          </div>
          {courtCases.slice(0, 3).map(c => (
            <CourtCaseRow key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, value, color, desc }: { label: string; value: number; color: 'blue' | 'emerald'; desc: string }) {
  const colors = {
    blue: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`text-lg font-bold ${c.text}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{desc}</p>
    </div>
  )
}

// ─── Вкладка Суды ────────────────────────────────────────
function CourtsTab({ courtCases }: { courtCases: CourtCase[] }) {
  if (courtCases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Судебных дел не найдено</h3>
        <p className="text-sm text-gray-400">Это хороший знак — компания не фигурирует в судебных реестрах</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Все судебные дела</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {courtCases.map(c => <CourtCaseRow key={c.id} c={c} />)}
      </div>
    </div>
  )
}

function CourtCaseRow({ c }: { c: CourtCase }) {
  const typeMap: Record<string, string> = {
    civil: 'Гражданское', tax: 'Налоговое', criminal: 'Уголовное',
    administrative: 'Административное', bankruptcy: 'Банкротство'
  }
  const isActive = c.case_status === 'active'

  return (
    <div className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isActive ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isActive ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {isActive ? 'Активное' : 'Завершено'}
            </span>
            {c.case_type && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {typeMap[c.case_type] || c.case_type}
              </span>
            )}
            {c.role && (
              <span className="text-xs text-gray-400">
                {c.role === 'defendant' ? 'Ответчик' : c.role === 'plaintiff' ? 'Истец' : 'Третья сторона'}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700">
            {c.case_number && <span className="font-medium">№ {c.case_number}</span>}
            {c.court_name && <span className="text-gray-400"> · {c.court_name}</span>}
          </div>
          {c.result && <p className="text-xs text-gray-400 mt-0.5">{c.result}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          {c.amount && <div className="text-sm font-semibold text-gray-800">{formatMoney(c.amount)}</div>}
          <div className="text-xs text-gray-400">{formatDate(c.case_date)}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Вкладка Отзывов ─────────────────────────────────────
function ReviewsTab({ type, reviews, companyId, companyName }: {
  type: 'employee' | 'counterparty'; reviews: any[]; companyId: string; companyName: string
}) {
  const isEmployee = type === 'employee'
  const addUrl = `/reviews/add?company=${companyId}&type=${type}`

  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating_overall, 0) / reviews.length
    : 0

  const distribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating_overall === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating_overall === star).length / reviews.length * 100) : 0
  }))

  return (
    <div className="space-y-4">

      {/* Сводка рейтинга */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
              <div className="flex justify-center mt-1 mb-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <div className="text-xs text-gray-400">{reviews.length} отзывов</div>
            </div>
            <div className="flex-1 min-w-48 space-y-1.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка добавить */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {isEmployee ? 'Отзывы сотрудников' : 'Отзывы контрагентов'}
        </h2>
        <Link href={addUrl}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
          + Написать отзыв
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-sm mb-4">Отзывов пока нет. Станьте первым!</div>
          <Link href={addUrl}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Написать отзыв
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, type }: { review: any; type: string }) {
  const isEmployee = type === 'employee'
  const [helpful, setHelpful] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating_overall ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-sm font-semibold text-gray-700">{review.rating_overall}/5</span>
            {review.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" /> Верифицирован
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{review.title}</h3>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(review.created_at)}</span>
      </div>

      {isEmployee ? (
        <div className="space-y-2.5 mb-3">
          {review.pros && (
            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Плюсы</span>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Минусы</span>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{review.cons}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{review.content}</p>
      )}

      {/* Sub-ratings для сотрудников */}
      {isEmployee && (review.rating_salary || review.rating_management) && (
        <div className="flex flex-wrap gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
          {[
            ['Зарплата', review.rating_salary],
            ['Руководство', review.rating_management],
            ['Культура', review.rating_culture],
            ['Рост', review.rating_growth],
          ].filter(([,v]) => v).map(([label, value]) => (
            <div key={label as string} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{label as string}</span>
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= (value as number) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex gap-3 text-xs text-gray-400">
          {isEmployee && review.position_category && <span>{review.position_category}</span>}
          {isEmployee && review.is_current_employee !== null && (
            <span>{review.is_current_employee ? '• Работает сейчас' : '• Бывший сотрудник'}</span>
          )}
          {!isEmployee && review.deal_year && <span>Сделка: {review.deal_year}</span>}
        </div>
        <button onClick={() => setHelpful(!helpful)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${helpful ? 'text-blue-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
          <ThumbsUp className="w-3.5 h-3.5" />
          Полезно {((review.helpful_count || 0) + (helpful ? 1 : 0)) > 0 && `(${(review.helpful_count || 0) + (helpful ? 1 : 0)})`}
        </button>
      </div>
    </div>
  )
}

// ─── Сайдбар ─────────────────────────────────────────────
function CompanySidebar({ company, taxRecords }: { company: Company; taxRecords: TaxRecord[] }) {
  const fields = [
    { label: 'БИН', value: formatBin(company.bin) },
    { label: 'Правовая форма', value: company.legal_form },
    { label: 'Дата регистрации', value: formatDate(company.registration_date) },
    { label: 'Отрасль', value: company.industry_name },
    { label: 'Регион', value: company.region },
    { label: 'Адрес', value: company.address },
    { label: 'Директор', value: company.director_name },
    { label: 'Уставной капитал', value: formatMoney(company.charter_capital) },
  ].filter(f => f.value && f.value !== '—')

  return (
    <>
      {/* Данные компании */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Сведения</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {fields.map(f => (
            <div key={f.label} className="px-5 py-3">
              <div className="text-xs text-gray-400 mb-0.5">{f.label}</div>
              <div className="text-sm text-gray-800 font-medium">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Налоги */}
      {taxRecords.filter(r => r.is_active).length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-800">Налоговые ограничения</span>
          </div>
          {taxRecords.filter(r => r.is_active).map(r => (
            <p key={r.id} className="text-xs text-red-700">
              {r.description || r.record_type}
              {r.amount ? ` · ${formatMoney(r.amount)}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* CTA для компаний */}
      {!company.is_claimed && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-1.5">Это ваша компания?</h4>
          <p className="text-xs text-blue-700 mb-3 leading-relaxed">
            Заявите профиль, чтобы отвечать на отзывы и управлять репутацией на Lookout.
          </p>
          <Link href={`/claim/${company.bin}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900">
            Заявить профиль <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Источник данных */}
      <div className="text-xs text-gray-400 text-center px-2">
        Данные из официальных реестров КГД, eGov, Sud.kz
        <br />
        {company.last_scraped_at && `Обновлено: ${formatDate(company.last_scraped_at)}`}
      </div>
    </>
  )
}
