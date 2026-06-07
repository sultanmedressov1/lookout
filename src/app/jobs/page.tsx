import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Briefcase, Clock, Building2, Star, Plus, Search, DollarSign } from 'lucide-react'

export const metadata: Metadata = { title: 'Вакансии в Казахстане — Lookout' }

interface PageProps { searchParams: { q?: string; city?: string; category?: string; type?: string; salary_from?: string; salary_to?: string; experience?: string } }

const CATEGORIES = ['IT и разработка','Менеджмент','Продажи','Маркетинг','Финансы','HR','Операции','Дизайн','Аналитика','Другое']
const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар']
const TYPES = [['full-time','Полная ставка'],['part-time','Частичная'],['contract','Контракт'],['intern','Стажировка'],['remote','Удалённо']]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${Math.round(n/1_000)} тыс`
  return String(n)
}

export default async function JobsPage({ searchParams }: PageProps) {
  const supabase = createClient()

  let query = supabase.from('jobs')
    .select('*, companies(name_ru, slug, city, industry_name, avg_rating, reviews_count)')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(50)

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)
  if (searchParams.city) query = query.eq('city', searchParams.city)
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.type) query = query.eq('employment_type', searchParams.type)
  if (searchParams.salary_from) query = query.gte('salary_from', parseInt(searchParams.salary_from))
  if (searchParams.salary_to) query = query.lte('salary_from', parseInt(searchParams.salary_to))
  if (searchParams.experience) query = query.eq('experience_level', searchParams.experience)

  const { data: jobs } = await query
  const items = jobs || []

  const typeLabels: Record<string, string> = Object.fromEntries(TYPES)

  const hasFilters = searchParams.q || searchParams.city || searchParams.category || searchParams.type || searchParams.salary_from || searchParams.salary_to || searchParams.experience

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Вакансии</h1>
              <p className="text-gray-500 text-sm">{items.length} актуальных · с отзывами о работодателях</p>
            </div>
            <Link href="/jobs/add" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Разместить вакансию
            </Link>
          </div>

          {/* Фильтры */}
          <form method="GET" className="space-y-3">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="q" defaultValue={searchParams.q} placeholder="Должность или компания..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
            </div>

            {/* Фильтры в строку */}
            <div className="flex flex-wrap gap-2">
              <select name="city" defaultValue={searchParams.city}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                <option value="">Все города</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select name="category" defaultValue={searchParams.category}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                <option value="">Все направления</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select name="type" defaultValue={searchParams.type}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                <option value="">Тип занятости</option>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <select name="experience" defaultValue={searchParams.experience}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                <option value="">Опыт работы</option>
                <option value="no_exp">Нет опыта</option>
                <option value="up_to_1">До 1 года</option>
                <option value="one_to_three">От 1 до 3 лет</option>
                <option value="three_to_six">От 3 до 6 лет</option>
                <option value="over_six">Более 6 лет</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input name="salary_from" type="number" defaultValue={searchParams.salary_from}
                  placeholder="от ₸" min="0" step="50000"
                  className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                <span className="text-gray-400 text-sm">—</span>
                <input name="salary_to" type="number" defaultValue={searchParams.salary_to}
                  placeholder="до ₸" min="0" step="50000"
                  className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>

              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                Найти
              </button>

              {hasFilters && (
                <Link href="/jobs" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
                  Сбросить
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Вакансий не найдено</h3>
            <p className="text-gray-400 text-sm">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((job: any) => {
              const company = job.companies
              const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600">{job.title}</h3>
                            {company && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-blue-600">{company.name_ru}</span>
                                {company.avg_rating > 0 && (
                                  <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {Number(company.avg_rating).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {job.salary_visible && (job.salary_from || job.salary_to) && (
                            <div className="text-sm font-semibold text-emerald-700 flex-shrink-0">
                              {job.salary_from && job.salary_to ? `${fmt(job.salary_from)}–${fmt(job.salary_to)} ₸`
                                : job.salary_from ? `от ${fmt(job.salary_from)} ₸`
                                : `до ${fmt(job.salary_to)} ₸`}/мес
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          {job.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}{job.is_remote ? ' · Удалённо' : ''}</span>}
                          {job.employment_type && <span><Briefcase className="w-3 h-3 inline mr-0.5" />{typeLabels[job.employment_type]}</span>}
                          {job.category && <span>{job.category}</span>}
                          <span><Clock className="w-3 h-3 inline mr-0.5" />{daysAgo === 0 ? 'сегодня' : daysAgo === 1 ? 'вчера' : `${daysAgo} дн.`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
