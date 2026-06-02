import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompanyPageClient } from '@/components/company/CompanyPageClient'
import { formatDate, formatBin } from '@/lib/utils'

interface PageProps { params: { bin: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: c } = await supabase
    .from('companies').select('name_ru, city, industry_name, risk_score, avg_rating, reviews_count')
    .eq('bin', params.bin).single()
  if (!c) return { title: 'Компания не найдена' }
  return {
    title: `${c.name_ru} — отзывы и проверка`,
    description: `${c.name_ru}: ${c.reviews_count || 0} отзывов сотрудников, суды, налоги. Риск-балл: ${c.risk_score}/100.`,
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: company, error } = await supabase
    .from('companies').select('*').eq('bin', params.bin).single()
  if (error || !company) notFound()

  const [courtRes, taxRes, empRes, cptyRes] = await Promise.all([
    supabase.from('court_cases').select('*').eq('company_id', company.id).order('case_date', { ascending: false }).limit(50),
    supabase.from('tax_records').select('*').eq('company_id', company.id),
    supabase.from('reviews_employee').select('*').eq('company_id', company.id).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('reviews_counterparty').select('*').eq('company_id', company.id).eq('is_published', true).order('created_at', { ascending: false }),
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
