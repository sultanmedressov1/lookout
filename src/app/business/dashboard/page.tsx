import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Star, DollarSign, Eye, Settings } from 'lucide-react'

export default async function BusinessDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const meta = user.user_metadata
  if (meta?.type !== 'business') redirect('/')

  const companyId = meta.company_id
  const companyName = meta.company_name

  // Загружаем статистику
  const [jobsRes, reviewsRes] = await Promise.all([
    supabase.from('jobs').select('id, title, is_active, views_count, created_at')
      .eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('reviews_employee').select('id, rating_overall, created_at')
      .eq('company_id', companyId).eq('is_published', true),
  ])

  const jobs = jobsRes.data || []
  const reviews = reviewsRes.data || []
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating_overall, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Шапка */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Панель управления</p>
          </div>
          <Link href="/jobs/add"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Новая вакансия
          </Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: 'Активных вакансий', value: jobs.filter(j => j.is_active).length, color: 'text-blue-600 bg-blue-50' },
            { icon: Eye, label: 'Просмотров вакансий', value: jobs.reduce((a, j) => a + (j.views_count || 0), 0), color: 'text-purple-600 bg-purple-50' },
            { icon: Star, label: 'Рейтинг', value: avgRating ? `${avgRating} ★` : '—', color: 'text-amber-600 bg-amber-50' },
            { icon: DollarSign, label: 'Отзывов', value: reviews.length, color: 'text-emerald-600 bg-emerald-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Вакансии */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Мои вакансии</h2>
            <Link href="/jobs/add" className="text-sm text-blue-600 hover:text-blue-800">+ Добавить</Link>
          </div>

          {jobs.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              Вакансий пока нет.{' '}
              <Link href="/jobs/add" className="text-blue-600">Разместить первую →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                      {job.title}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {job.views_count || 0} просмотров
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.is_active ? 'Активна' : 'Закрыта'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ссылки */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href={`/company/${meta.company_bin}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="font-medium text-gray-900 text-sm mb-1">Страница компании</div>
            <div className="text-xs text-gray-500">Смотрите как видят вас кандидаты →</div>
          </Link>
          <Link href="/jobs"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="font-medium text-gray-900 text-sm mb-1">Все вакансии</div>
            <div className="text-xs text-gray-500">Смотрите конкурентов →</div>
          </Link>
        </div>

      </div>
    </div>
  )
}
