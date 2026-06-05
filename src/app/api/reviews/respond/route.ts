import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.type !== 'business') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { review_id, company_id, content } = await req.json()
  if (!review_id || !company_id || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Удаляем предыдущий ответ если есть (один ответ на отзыв)
  await admin.from('review_responses').delete().eq('review_id', review_id)

  const { data, error } = await admin.from('review_responses').insert([{
    review_id, company_id, user_id: user.id, content: content.trim()
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ response: data })
}
