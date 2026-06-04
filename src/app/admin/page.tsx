import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin — Lookout' }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export default async function AdminPage() {
  // Проверка авторизации
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  // Проверка service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <h2 className="text-lg font-bold text-red-700 mb-2">Отсутствует SUPABASE_SERVICE_ROLE_KEY</h2>
          <p className="text-sm text-gray-500">
            Добавь переменную окружения в Vercel → Settings → Environment Variables:<br />
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs mt-2 block">SUPABASE_SERVICE_ROLE_KEY = eyJ...</code>
          </p>
        </div>
      </div>
    )
  }

  // Используем динамический импорт чтобы избежать ошибок сборки
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // Параллельные запросы с обработкой ошибок
  const [empReviewsRes, interviewsRes, requestsRes] = await Promise.all([
    admin.from('reviews_employee')
      .select('id, title, rating_overall, is_published, created_at, companies(name_ru, bin)')
      .order('created_at', { ascending: false }).limit(100)
      .then(r => r).catch(() => ({ data: [] })),

    admin.from('reviews_interview')
      .select('id, title, experience, is_published, created_at, companies(name_ru, bin)')
      .order('created_at', { ascending: false }).limit(100)
      .then(r => r).catch(() => ({ data: [] })),

    admin.from('business_requests')
      .select('id, company_name, company_bin, contact_name, contact_email, status, created_at')
      .order('created_at', { ascending: false }).limit(100)
      .then(r => r).catch(() => ({ data: [] })),
  ])

  return (
    <AdminClient
      empReviews={(empReviewsRes as any).data || []}
      interviews={(interviewsRes as any).data || []}
      requests={(requestsRes as any).data || []}
    />
  )
}
