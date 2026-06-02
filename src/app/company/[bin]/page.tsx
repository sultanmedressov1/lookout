import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompanyPageClient } from '@/components/company/CompanyPageClient'
import { CompanyFetcher } from '@/components/company/CompanyFetcher'

interface PageProps { params: { bin: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: c } = await supabase
    .from('companies').select('name_ru, city, risk_score, reviews_count')
    .eq('bin', params.bin).single()
  if (!c) return { title: `Компания ${params.bin} | Lookout` }
  return {
    title: `${c.name_ru} — отзывы и проверка | Lookout`,
    description: `${c.name_ru}: отзывы сотрудников, суды, налоги. Риск-балл: ${c.risk_score}/100.`,
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: company } = await supabase
    .from('companies').select('*').eq('bin', params.bin).single()

  // Компании нет в кэше → показываем загрузку
  // CompanyFetcher сам вызовет KGD API и обновит страницу
  if (!company) {
    return <CompanyFetcher bin={params.bin} />
  }

  const [courtRes, taxRes, empRes, cptyRes] = await Promise.all([
    supabase.from('court_cases').select('*').eq('company_id', company.id)
      .order('case_date', { ascending: false }).limit(50),
    supabase.from('tax_records').select('*').eq('company_id', company.id),
    supabase.from('reviews_employee').select('*').eq('company_id', company.id)
      .eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('reviews_counterparty').select('*').eq('company_id', company.id)
      .eq('is_published', true).order('created_at', { ascending: false }),
  ])

  return (
    <CompanyPageClient
      company={company}
      courtCases={courtRes.data || []}
      taxRecords={taxRes.data || []}
      empReviews={empRes.data || []}
      cptyReviews={cptyRes.data || []}
    />
  )
}
