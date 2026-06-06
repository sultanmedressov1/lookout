import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Star, Eye, Users, Bell } from 'lucide-react'
import DashboardClient from './DashboardClient'

export default async function BusinessDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  if (user.user_metadata?.type !== 'business') redirect('/')

  const admin = createAdminClient()
  const { data: request } = await admin.from('business_requests').select('status').eq('user_id', user.id).single()
  if (!request || request.status === 'pending') redirect('/auth/pending')
  if (request.status === 'rejected') redirect('/auth/signin')

  const meta = user.user_metadata
  const companyName = meta?.company_name
  let companyShortId = meta?.company_short_id

  // Резолюция slug через company_id
  if (!companyShortId && meta?.company_id) {
    const { data: co } = await admin.from('companies').select('slug').eq('id', meta.company_id).single()
    companyShortId = co?.short_id
  }

  // Последняя попытка — по имени
  if (!companyShortId && companyName) {
    const { data: co } = await admin.from('companies').select('slug').ilike('name_ru', companyName).limit(1).maybeSingle()
    companyShortId = co?.short_id
  }

  // company_id для запросов
  let companyId = meta?.company_id
  if (!companyId && companyShortId) {
    const { data: co } = await admin.from('companies').select('id').eq('slug', companyShortId).single()
    companyId = co?.id
  }

  const [jobsRes, reviewsRes, appsRes, notifsRes] = await Promise.all([
    admin.from('jobs').select('id, title, is_active, views_count, applications_count, created_at')
      .eq('company_id', companyId).order('created_at', { ascending: false }),
    admin.from('reviews_employee').select('id, rating_overall')
      .eq('company_id', companyId).eq('is_published', true),
    admin.from('job_applications').select('id, status, job_id, applicant_name, created_at, worker_profile_id, jobs(title)')
      .eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
    admin.from('notifications').select('id').eq('user_id', user.id).eq('is_read', false),
  ])

  const jobs = jobsRes.data || []
  const reviews = reviewsRes.data || []
  const applications = appsRes.data || []
  const unreadNotifs = notifsRes.data?.length || 0
  const newApps = applications.filter((a: any) => a.status === 'new').length
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating_overall, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Панель управления</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadNotifs > 0 && (
              <Link href="/notifications" className="relative inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                <Bell className="w-4 h-4" />
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">{unreadNotifs}</span>
              </Link>
            )}
            <div className="flex items-center gap-3 flex-wrap">
            <Link href="/business/profile"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              Профиль компании
            </Link>
            <Link href="/jobs/add" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Новая вакансия
            </Link>
          </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: 'Активных вакансий', value: jobs.filter((j: any) => j.is_active).length, color: 'text-blue-600 bg-blue-50' },
            { icon: Users, label: 'Новых откликов', value: newApps, color: newApps > 0 ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-50' },
            { icon: Star, label: 'Рейтинг', value: avgRating ? `${avgRating} ★` : '—', color: 'text-amber-600 bg-amber-50' },
            { icon: Eye, label: 'Просмотров', value: jobs.reduce((a: number, j: any) => a + (j.views_count || 0), 0), color: 'text-purple-600 bg-purple-50' },
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

        <DashboardClient jobs={jobs} applications={applications} companyShortId={companyShortId || ''} />
      </div>
    </div>
  )
}
