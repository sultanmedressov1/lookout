import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompanyPageClient } from '@/components/company/CompanyPageClient'

interface PageProps { params: { id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('companies').select('name_ru').eq('short_id', params.id).maybeSingle()
  if (!data) return { title: 'Компания не найдена | Lookout' }
  return {
    title: `${data.name_ru} — отзывы сотрудников | Lookout`,
    description: `${data.name_ru}: отзывы сотрудников, зарплаты, вакансии.`,
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: company } = await supabase
    .from('companies').select('*').eq('short_id', params.id).maybeSingle()

  if (!company) notFound()

  // Собираем все ID компаний с таким же названием (защита от дублей)
  const { data: siblings } = await supabase
    .from('companies').select('id').ilike('name_ru', company.name_ru)
  const allIds = Array.from(new Set([company.id, ...(siblings?.map((s: any) => s.id) || [])]))

  const [courtRes, taxRes, empRes, cptyRes, responsesRes] = await Promise.all([
    supabase.from('court_cases').select('*')
      .eq('company_id', company.id).order('case_date', { ascending: false }).limit(50),
    supabase.from('tax_records').select('*').eq('company_id', company.id),
    supabase.from('reviews_employee').select('*')
      .in('company_id', allIds).order('created_at', { ascending: false }),
    supabase.from('reviews_counterparty').select('*')
      .eq('company_id', company.id).order('created_at', { ascending: false }),
    supabase.from('review_responses').select('*').in('company_id', allIds),
  ])

  const responsesByReview: Record<string, any> = {}
  for (const r of (responsesRes.data || [])) responsesByReview[r.review_id] = r

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
