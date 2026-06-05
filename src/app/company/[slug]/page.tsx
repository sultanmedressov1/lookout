import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompanyPageClient } from '@/components/company/CompanyPageClient'

interface PageProps { params: { slug: string } }

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const query = supabase.from('companies').select('name_ru, avg_rating, reviews_count')
  const { data: c } = isUUID(params.slug)
    ? await query.or(`slug.eq.${params.slug},id.eq.${params.slug}`).limit(1).maybeSingle()
    : await query.eq('slug', params.slug).maybeSingle()
  if (!c) return { title: 'Компания не найдена | Lookout' }
  return {
    title: `${c.name_ru} — отзывы сотрудников | Lookout`,
    description: `${c.name_ru}: отзывы сотрудников, зарплаты, вакансии.`,
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const supabase = createClient()

  // Ищем по slug, если не нашли и выглядит как UUID — ищем по id
  let { data: company } = await supabase.from('companies').select('*').eq('slug', params.slug).maybeSingle()

  if (!company && isUUID(params.slug)) {
    const { data: byId } = await supabase.from('companies').select('*').eq('id', params.slug).maybeSingle()
    if (byId?.slug) redirect(`/company/${byId.slug}`)
    company = byId
  }

  if (!company) notFound()

  const [courtRes, taxRes, empRes, cptyRes, responsesRes] = await Promise.all([
    supabase.from('court_cases').select('*').eq('company_id', company.id).order('case_date', { ascending: false }).limit(50),
    supabase.from('tax_records').select('*').eq('company_id', company.id),
    supabase.from('reviews_employee').select('*').eq('company_id', company.id).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('reviews_counterparty').select('*').eq('company_id', company.id).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('review_responses').select('*').eq('company_id', company.id),
  ])

  // Группируем ответы по review_id
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
