import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Star, Eye, DollarSign, Bell, Users } from 'lucide-react'

export default async function BusinessDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  if (user.user_metadata?.type !== 'business') redirect('/')

  const admin = createAdminClient()
  const { data: request } = await admin.from('business_requests').select('status').eq('user_id', user.id).single()
  if (!request || request.status === 'pending') redirect('/auth/pending')
  if (request.status === 'rejected') redirect('/auth/signin')

  const companyId = user.user_metadata?.company_id
  const companyName = user.user_metadata?.company_name
  const companyBin = user.user_metadata?.company_bin

  // Ищем company_id по BIN если не в метаданных
  let resolvedCompanyId = companyId
  if (!resolvedCompanyId && companyBin) {
    const { data: co } = await admin.from('companies').select('id').eq('bin', companyBin).single()
    resolvedCompanyId = co?.id
  }

  const [jobsRes, reviewsRes, appsRes] = await Promise.all([
    admin.from('jobs').select('id, title, is_active, views_count, applications_count, created_at')
      .eq('company_id', resolvedCompanyId).order('created_at', { ascending: false }),
    admin.from('reviews_employee').select('id, rating_overall')
      .eq('company_id', resolvedCompanyId).eq('is_published', true),
    admin.from('job_applications').select('id, status, job_id, applicant_name, created_at, jobs(title)')
      .eq('company_id', resolvedCompanyId).order('created_at', { ascending: false }).limit(10),
  ])

  const jobs = jobsRes.data || []
  const reviews = reviewsRes.data || []
  const applications = appsRes.data || []
  const newApps = applications.filter(a => a.status === 'new').length
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating_overall, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Панель управления</p>
          </div>
          <Link href="/jobs/add" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Новая вакансия
          </Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: 'Активных вакансий', value: jobs.filter(j => j.is_active).length, color: 'text-blue-600 bg-blue-50' },
            { icon: Users, label: 'Новых откликов', value: newApps, color: newApps > 0 ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-50', badge: newApps > 0 },
            { icon: Star, label: 'Рейтинг', value: avgRating ? `${avgRating} ★` : '—', color: 'text-amber-600 bg-amber-50' },
            { icon: Eye, label: 'Просмотров', value: jobs.reduce((a, j) => a + (j.views_count || 0), 0), color: 'text-purple-600 bg-purple-50' },
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Вакансии */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Вакансии</h2>
              <Link href="/jobs/add" className="text-sm text-blue-600 hover:text-blue-800">+ Добавить</Link>
            </div>
            {jobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                <Link href="/jobs/add" className="text-blue-600">Разместить первую вакансию →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{job.title}</Link>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                        <span>{job.views_count || 0} просмотров</span>
                        {(job.applications_count || 0) > 0 && (
                          <Link href={`/business/applications/${job.id}`} className="text-blue-600 font-medium">
                            {job.applications_count} откликов →
                          </Link>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {job.is_active ? 'Активна' : 'Закрыта'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Последние отклики */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">Отклики</h2>
                {newApps > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">{newApps} новых</span>
                )}
              </div>
            </div>
            {applications.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Откликов пока нет</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-700">{app.applicant_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{app.applicant_name}</div>
                      <Link href={`/business/applications/${app.job_id}`} className="text-xs text-gray-400 hover:text-blue-600 truncate block">
                        {(app.jobs as any)?.title}
                      </Link>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      app.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {app.status === 'new' ? 'Новый' : app.status === 'shortlisted' ? 'В шортлисте' : app.status === 'rejected' ? 'Отклонён' : 'Просмотрен'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Быстрые ссылки */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {companyBin && (
            <Link href={`/company/${companyBin}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="font-medium text-gray-900 text-sm mb-1">Страница компании</div>
              <div className="text-xs text-gray-500">Как видят вас кандидаты →</div>
            </Link>
          )}
          <Link href="/jobs" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="font-medium text-gray-900 text-sm mb-1">Все вакансии</div>
            <div className="text-xs text-gray-500">Смотреть конкурентов →</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
