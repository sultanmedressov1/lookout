import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function makeSlug(name: string): string {
  const m: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
    'ы':'y','э':'e','ю':'yu','я':'ya','ъ':'','ь':''
  }
  return name.toLowerCase().split('').map(c => m[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    + '-' + Math.random().toString(36).slice(2, 6)
}

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

  // Попытка 1: company_id уже в метаданных
  if (meta?.company_id) {
    const { data } = await admin.from('companies').select('id, slug').eq('id', meta.company_id).single()
    if (data) return NextResponse.json({ company_id: data.id, slug: data.slug })
  }

  // Попытка 2: ищем по имени
  const { data: existing } = await admin
    .from('companies')
    .select('id, slug')
    .ilike('name_ru', companyName)
    .limit(1)
    .maybeSingle()

  if (existing) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, company_id: existing.id, company_slug: existing.slug }
    })
    return NextResponse.json({ company_id: existing.id, slug: existing.slug })
  }

  // Попытка 3: создаём компанию
  const slug = makeSlug(companyName)
  const { data: newCo, error } = await admin
    .from('companies')
    .insert({ name_ru: companyName, slug, status: 'active' })
    .select('id, slug')
    .single()

  if (error || !newCo) {
    return NextResponse.json({ error: error?.message || 'Ошибка создания' }, { status: 500 })
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, company_id: newCo.id, company_slug: newCo.slug }
  })

  return NextResponse.json({ company_id: newCo.id, slug: newCo.slug })
}
