import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Clock, DollarSign, Building2, Search, Briefcase, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Вакансии в Казахстане — Lookout',
  description: 'Актуальные вакансии от проверенных работодателей Казахстана с отзывами сотрудников.',
}

interface PageProps {
  searchParams: { q?: string; city?: string; category?: string; type?: string }
}

const CATEGORIES = [
  'IT и разработка', 'Менеджмент', 'Продажи', 'Маркетинг',
  'Финансы', 'HR', 'Операции', 'Дизайн', 'Аналитика', 'Другое'
]

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз', 'Павлодар']

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс`
  return String(n)
}

export default async function JobsPage({ searchParams }: PageProps) {
  const supabase = createClient()

  let query = supabase
    .from('jobs')
    .select('*, companies(name_ru, bin, city, industry_name, avg_rating, reviews_count)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)
  if (searchParams.city) query = query.eq('city', searchParams.city)
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.type) query = query.eq('employment_type', searchParams.type)

  const { data: jobs } = await query
  const items = jobs || []

  const typeLabels: Record<string, string> = {
    'full-time': 'Полная ставка', 'part-time': 'Частичная',
    'contract': 'Контракт', 'intern': 'Стажировка', 'remote': 'Удалённо'
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero с поиском */}
      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Вакансии</h1>
              <p className="text-gray-500 text-sm">
                {items.length > 0 ? `${items.length} актуальных вакансий` : 'Вакансий пока нет'}
                {' · '}с отзывами о работодателях
              </p>
            </div>
            <Link href="/jobs/add"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Разместить вакансию
            </Link>
          </div>

          {/* Фильтры */}
          <form method="GET" className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="q" defaultValue={searchParams.q} placeholder="Должность или компания..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <select name="city" defaultValue={searchParams.city}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
              <option value="">Все города</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select name="category" defaultValue={searchParams.category}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
              <option value="">Все категории</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Найти
            </button>
            {(searchParams.q || searchParams.city || searchParams.category) && (
              <Link href="/jobs" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
                Сбросить
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Список вакансий */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Вакансий пока нет</h3>
            <p className="text-gray-400 text-sm mb-6">Разместите первую вакансию — это бесплатно</p>
            <Link href="/jobs/add"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              Разместить вакансию
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((job: any) => (
              <JobCard key={job.id} job={job} typeLabels={typeLabels} fmt={fmt} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, typeLabels, fmt }: { job: any; typeLabels: Record<string, string>; fmt: (n: number) => string }) {
  const company = job.companies
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all">
        <div className="flex items-start gap-4">

          {/* Лого компании */}
          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>

          {/* Основное */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
              <div>
                <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{job.title}</h3>
                {company && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-blue-600">{company.name_ru}</span>
                    {company.avg_rating && (
                      <span className="text-xs text-amber-600">★ {Number(company.avg_rating).toFixed(1)}</span>
                    )}
                    {company.reviews_count > 0 && (
                      <span className="text-xs text-gray-400">{company.reviews_count} отзывов</span>
                    )}
                  </div>
                )}
              </div>

              {/* Зарплата */}
              {job.salary_visible && (job.salary_from || job.salary_to) && (
                <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {job.salary_from && job.salary_to
                    ? `${fmt(job.salary_from)} – ${fmt(job.salary_to)} ₸`
                    : job.salary_from
                    ? `от ${fmt(job.salary_from)} ₸`
                    : `до ${fmt(job.salary_to!)} ₸`
                  }
                  <span className="text-xs font-normal text-gray-400">/мес</span>
                </div>
              )}
            </div>

            {/* Мета */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              {job.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{job.city}
                  {job.is_remote && ' · Удалённо'}
                </span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {typeLabels[job.employment_type] || job.employment_type}
                </span>
              )}
              {job.category && <span>{job.category}</span>}
              {job.experience_level && job.experience_level !== 'any' && (
                <span className="capitalize">{job.experience_level}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysAgo === 0 ? 'сегодня' : daysAgo === 1 ? 'вчера' : `${daysAgo} дн. назад`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
