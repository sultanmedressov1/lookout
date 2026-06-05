import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Bookmark, MapPin, Briefcase, Building2, Star } from 'lucide-react'

export const metadata: Metadata = { title: 'Сохранённые вакансии — Lookout' }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${Math.round(n/1_000)} тыс`
  return String(n)
}

export default async function SavedJobsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: saved } = await supabase
    .from('saved_jobs')
    .select('*, jobs(*, companies(name_ru, slug, avg_rating, reviews_count))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = saved || []
  const currencySymbol: Record<string, string> = { KZT: '₸', USD: '$', EUR: '€' }
  const typeLabels: Record<string, string> = {
    'full-time':'Полная ставка','part-time':'Частичная','contract':'Контракт','intern':'Стажировка','remote':'Удалённо'
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Сохранённые вакансии</h1>
            <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'вакансия' : 'вакансий'}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bookmark className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Нет сохранённых вакансий</h3>
            <p className="text-sm text-gray-400 mb-5">Нажмите 🔖 на любой вакансии чтобы сохранить её</p>
            <Link href="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Смотреть вакансии →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s: any) => {
              const job = s.jobs
              if (!job) return null
              const company = job.companies
              const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)
              const sym = currencySymbol[job.salary_currency || 'KZT'] || '₸'

              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm block">
                            {job.title}
                          </Link>
                          {company && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Link href={`/company/${company.slug}`} className="text-xs text-blue-600 hover:text-blue-800">{company.name_ru}</Link>
                              {company.avg_rating > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {Number(company.avg_rating).toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {job.salary_visible && (job.salary_from || job.salary_to) && (
                          <div className="text-sm font-semibold text-emerald-700 flex-shrink-0">
                            {job.salary_from && job.salary_to
                              ? `${fmt(job.salary_from)}–${fmt(job.salary_to)} ${sym}`
                              : job.salary_from ? `от ${fmt(job.salary_from)} ${sym}`
                              : `до ${fmt(job.salary_to)} ${sym}`}/мес
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1.5">
                        {job.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}</span>}
                        {job.employment_type && <span>{typeLabels[job.employment_type]}</span>}
                        <span>{daysAgo === 0 ? 'Сегодня' : daysAgo === 1 ? 'Вчера' : `${daysAgo} дн. назад`}</span>
                        <span className="text-amber-500">Сохранено {new Date(s.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
