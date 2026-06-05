import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Bell, BriefcaseIcon, Star, CheckCircle2 } from 'lucide-react'
import NotificationsClient from './NotificationsClient'

export const metadata: Metadata = { title: 'Уведомления — Lookout' }

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          {(notifications?.some(n => !n.is_read)) && (
            <form action="/api/notifications/read" method="POST">
              <NotificationsClient notifications={notifications || []} />
            </form>
          )}
        </div>
        <NotificationsClient notifications={notifications || []} />
      </div>
    </div>
  )
}
