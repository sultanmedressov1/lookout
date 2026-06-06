import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id } = await req.json()
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('saved_jobs').select('id').eq('user_id', user.id).eq('job_id', job_id).maybeSingle()

  if (existing) {
    await admin.from('saved_jobs').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  } else {
    const { error } = await admin.from('saved_jobs').insert([{ user_id: user.id, job_id }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: true })
  }
}
