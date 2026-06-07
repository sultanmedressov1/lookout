import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id } = await req.json()
  if (!job_id) return NextResponse.json({ error: 'No job_id' }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('saved_jobs').select('id').eq('user_id', user.id).eq('job_id', job_id).maybeSingle()

  if (existing) {
    const { error } = await admin.from('saved_jobs').delete().eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ saved: false })
  }

  const { error } = await admin.from('saved_jobs').insert([{ user_id: user.id, job_id }])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: true })
}
