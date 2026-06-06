import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.type !== 'business') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, external_status } = await req.json()
  const admin = createAdminClient()
  const { error } = await admin.from('job_applications').update({ external_status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
