import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json() // массив id или 'all'

  if (ids === 'all') {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  } else if (Array.isArray(ids)) {
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
  }

  return NextResponse.json({ success: true })
}
