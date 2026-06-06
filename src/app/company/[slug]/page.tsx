import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompanyPageClient } from '@/components/company/CompanyPageClient'

interface PageProps { params: { slug: string } }

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const query = supabase.from('companies').select('name_ru')
  const { data: c } = isUUID(params.slug)
    ? await query.or(`slug.eq.${params.slug},id.eq.${params.slug}`).limit(1).maybeSingle()
    : await query.eq('slug', params.slug).maybeSingle()
  if (!c) return { title: 'Компания не найдена | Lookout' }
  return { title: `${c.name_ru} — отзывы сотрудников | Lookout` }
}

export default async function CompanyPage({ params }: PageProps) {
  const supabase = createClient()

  // Ищем по slug
  let { data: company } = await supabase.from('companies').select('*').eq('slug', params.slug).maybeSingle()

  // Если не нашли и выглядит как UUID — ищем по id
  if (!company && isUUID(params.slug)) {
    const { data: byId } = await supabase.from('companies').select('*').eq('id', params.slug).maybeSingle()
    if (byId?.slug && byId.slug !== params.slug) redirect(`/company/${byId.slug}`)
    company = byId
  }

  if (!company) notFound()

  // Ищем ВСЕ компании с таким же названием (могут быть дубли)
  const { data: siblings } = await supabase
    .from('companies')
    .select('id')
    .ilike('name_ru', company.name_ru)
  const allIds = [...new Set([company.id, ...(siblings?.map(s => s.id) || [])])]

  const [courtRes, taxRes, empRes, cptyRes, responsesRes] = await Promise.all([
    supabase.from('court_cases').select('*').eq('company_id', company.id)
      .order('case_date', { ascending: false }).limit(50),
    supabase.from('tax_records').select('*').eq('company_id', company.id),
    // Ищем отзывы по ВСЕМ связанным ID компании
    supabase.from('reviews_employee').select('*')
      .in('company_id', allIds)
      .order('created_at', { ascending: false }),
    supabase.from('reviews_counterparty').select('*').eq('company_id', company.id)
      .order('created_at', { ascending: false }),
    supabase.from('review_responses').select('*').in('company_id', allIds),
  ])

  const responsesByReview: Record<string, any> = {}
  for (const r of (responsesRes.data || [])) {
    responsesByReview[r.review_id] = r
  }

  return (
    <CompanyPageClient
      company={company}
      courtCases={courtRes.data || []}
      taxRecords={taxRes.data || []}
      empReviews={empRes.data || []}
      cptyReviews={cptyRes.data || []}
      responsesByReview={responsesByReview}
    />
  )
}
