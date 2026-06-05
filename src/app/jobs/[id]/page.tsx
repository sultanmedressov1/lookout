import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import ApplySection from './ApplySection'
import SaveJobButton from './SaveJobButton'
import { MapPin, Briefcase, Clock, Building2, Star, ArrowLeft } from 'lucide-react'

interface PageProps { params: { id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: job } = await supabase.from('jobs').select('title, companies(name_ru)').eq('id', params.id).single()
  if (!job) return { title: 'Вакансия не найдена' }
  return { title: `${job.title} — ${(job.companies as any)?.name_ru} | Lookout` }
}

const currencySymbol: Record<string, string> = { KZT: '₸', USD: '$', EUR: '€' }

function fmt(n: number, currency = 'KZT') {
  const sym = currencySymbol[currency] || '₸'
  if (currency !== 'KZT') return `${sym}${n.toLocaleString()}`
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн ${sym}`
  if (n >= 1_000) return `${Math.round(n/1_000)} тыс ${sym}`
  return `${n} ${sym}`
}

export default async function JobPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: job } = await supabase.from('jobs').select('*, companies(*)').eq('id', params.id).single()
  if (!job) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: savedRecord } = user
    ? await supabase.from('saved_jobs').select('id').eq('user_id', user.id).eq('job_id', params.id).maybeSingle()
    : { data: null }

  const company = job.companies as any
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)
  const typeLabels: Record<string,string> = { 'full-time':'Полная ставка','part-time':'Частичная','contract':'Контракт','intern':'Стажировка','remote':'Удалённо' }
  const cur = job.salary_currency || 'KZT'

  // Ищем user_id работодателя для уведомлений
  const companyOwnerId = company?.id
    ? (await supabase.from('company_profiles').select('user_id').eq('company_id', company.id).maybeSingle()).data?.user_id
    : null

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Все вакансии
          </Link>
          <SaveJobButton jobId={params.id} initialSaved={!!savedRecord} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h1>
                  {company && <Link href={`/company/${company.slug || company.bin}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">{company.name_ru}</Link>}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                {job.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.city}{job.is_remote && ' · Удалённо'}</span>}
                {job.employment_type && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{typeLabels[job.employment_type]}</span>}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{daysAgo === 0 ? 'Сегодня' : daysAgo === 1 ? 'Вчера' : `${daysAgo} дн.`}</span>
              </div>

              {job.salary_visible && (job.salary_from || job.salary_to) && (
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium">
                  {job.salary_from && job.salary_to
                    ? `${fmt(job.salary_from, cur)} – ${fmt(job.salary_to, cur)}/мес`
                    : job.salary_from ? `от ${fmt(job.salary_from, cur)}/мес`
                    : `до ${fmt(job.salary_to!, cur)}/мес`}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Описание</h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
            {job.requirements && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Требования</h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
              </div>
            )}
            {job.nice_to_have && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Будет плюсом</h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.nice_to_have}</div>
              </div>
            )}

            <ApplySection jobId={job.id} companyId={job.company_id} jobTitle={job.title} companyUserId={companyOwnerId || undefined} />
          </div>

          <div className="space-y-4">
            {company && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-sm">О компании</h3></div>
                <div className="p-5">
                  <Link href={`/company/${company.slug || company.bin}`} className="font-medium text-blue-600 hover:text-blue-800 text-sm block mb-2">{company.name_ru}</Link>
                  {company.industry_name && <p className="text-xs text-gray-500 mb-2">{company.industry_name}</p>}
                  {company.avg_rating > 0 && (
                    <div className="flex items-center gap-1.5 text-sm mb-3">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium">{Number(company.avg_rating).toFixed(1)}</span>
                      <span className="text-gray-400 text-xs">{company.reviews_count} отзывов</span>
                    </div>
                  )}
                  <Link href={`/company/${company.slug || company.bin}`} className="text-xs text-blue-600 hover:text-blue-800">
                    Читать отзывы о работодателе →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
