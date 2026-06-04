import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SalariesAddLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.user_metadata?.type === 'business') {
    redirect('/business/dashboard')
  }

  return <>{children}</>
}
