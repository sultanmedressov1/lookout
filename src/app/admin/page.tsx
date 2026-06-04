import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin — Lookout' }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <h2 className="text-lg font-bold text-red-700 mb-2">Отсутствует SUPABASE_SERVICE_ROLE_KEY</h2>
          <p className="text-sm text-gray-500">Добавь в Vercel → Settings → Environment Variables</p>
        </div>
      </div>
    )
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const empSelect = 'id, title, rating_overall, is_published, created_at, companies(name_ru, bin)'
  const intSelect = 'id, title, experience, is_published, created_at, companies(name_ru, bin)'
  const salSelect = 'id, position_title, salary_monthly, is_published, created_at, companies(name_ru, bin)'
  const reqSelect = 'id, company_name, company_bin, contact_name, contact_email, status, created_at'

  const [e, i, s, r] = await Promise.all([
    admin.from('reviews_employee').select(empSelect).order('created_at', { ascending: false }).limit(100),
    admin.from('reviews_interview').select(intSelect).order('created_at', { ascending: false }).limit(100),
    admin.from('salaries').select(salSelect).order('created_at', { ascending: false }).limit(100),
    admin.from('business_requests').select(reqSelect).order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <AdminClient
      empReviews={e.data || []}
      interviews={i.data || []}
      salaries={s.data || []}
      requests={r.data || []}
    />
  )
}
