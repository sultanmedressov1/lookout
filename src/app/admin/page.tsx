import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin — Lookout' }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lookout.kz'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const [empReviewsRes, interviewsRes, requestsRes] = await Promise.all([
    supabase.from('reviews_employee')
      .select('id, title, rating_overall, is_published, created_at, companies(name_ru, bin)')
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('reviews_interview')
      .select('id, title, experience, is_published, created_at, companies(name_ru, bin)')
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('business_requests')
      .select('id, company_name, company_bin, contact_name, contact_email, status, created_at')
      .order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <AdminClient
      empReviews={empReviewsRes.data || []}
      interviews={interviewsRes.data || []}
      requests={requestsRes.data || []}
    />
  )
}
