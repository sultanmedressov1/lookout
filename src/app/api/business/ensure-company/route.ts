import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.type !== 'business') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const meta = user.user_metadata
  const companyName = meta?.company_name?.trim()

  if (!companyName) {
    return NextResponse.json({ error: 'Нет названия компании в аккаунте' }, { status: 400 })
  }

  // 1. Уже есть company_id в метаданных
  if (meta?.company_id) {
    const { data } = await admin.from('companies').select('id, short_id').eq('id', meta.company_id).single()
    if (data) return NextResponse.json({ company_id: data.id, short_id: data.short_id })
  }

  // 2. Ищем по имени
  const { data: existing } = await admin
    .from('companies').select('id, short_id').ilike('name_ru', companyName).limit(1).maybeSingle()

  if (existing) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, company_id: existing.id, company_short_id: existing.short_id }
    })
    return NextResponse.json({ company_id: existing.id, short_id: existing.short_id })
  }

  // 3. Создаём компанию (short_id генерируется автоматически БД)
  const { data: newCo, error } = await admin
    .from('companies')
    .insert({ name_ru: companyName, status: 'active' })
    .select('id, short_id')
    .single()

  if (error || !newCo) {
    return NextResponse.json({ error: error?.message || 'Ошибка создания' }, { status: 500 })
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, company_id: newCo.id, company_short_id: newCo.short_id }
  })

  return NextResponse.json({ company_id: newCo.id, short_id: newCo.short_id })
}
