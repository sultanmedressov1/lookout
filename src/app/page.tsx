import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { Star, Briefcase, DollarSign, Users, TrendingUp, MessageSquare, ChevronRight, Building2, MapPin, Clock } from 'lucide-react'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n/1_000)}K`
  return String(n)
}

function fmtSalary(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн ₸`
  if (n >= 1_000) return `${Math.round(n/1_000)} тыс ₸`
  return `${n} ₸`
}

export default async function HomePage() {
  const supabase = createClient()

  const [companiesRes, reviewsRes, jobsRes, salariesRes] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('reviews_employee').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('salaries').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const [topCompanies, latestJobs, latestReviews] = await Promise.all([
    supabase.from('companies').select('id, name_ru, slug, city, industry_name, avg_rating, reviews_count')
      .gt('reviews_count', 0).order('avg_rating', { ascending: false }).limit(6),
    supabase.from('jobs').select('id, title, city, employment_type, salary_from, salary_to, salary_currency, created_at, companies(name_ru, slug, avg_rating)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(4),
    supabase.from('reviews_employee').select('id, title, rating_overall, pros, created_at, companies(name_ru, slug)')
      .eq('is_published', true).order('created_at', { ascending: false }).limit(3),
  ])

  const typeLabel: Record<string, string> = { 'full-time': 'Полная ставка', 'part-time': 'Частичная', 'contract': 'Контракт', 'intern': 'Стажировка', 'remote': 'Удалённо' }
  const currSym: Record<string, string> = { KZT: '₸', USD: '$', EUR: '€' }

  return (
    <div className="bg-white">

      {/* ─── Hero ──────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Платформа о работодателях Казахстана
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Найдите честную работу.<br />Узнайте правду о работодателях.
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Реальные отзывы сотрудников, зарплаты и вакансии от казахстанских компаний.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar size="lg" theme="dark" />
          </div>

          {/* Статистика */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { label: 'Компаний', value: fmt(companiesRes.count || 0) },
              { label: 'Отзывов', value: fmt(reviewsRes.count || 0) },
              { label: 'Вакансий', value: fmt(jobsRes.count || 0) },
              { label: 'Зарплат', value: fmt(salariesRes.count || 0) },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Три раздела ───────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: MessageSquare, title: 'Отзывы', desc: 'Узнайте как реально работать в компании', href: '/search', color: 'bg-amber-50 text-amber-600', action: 'Написать отзыв', actionHref: '/reviews/add' },
              { icon: DollarSign, title: 'Зарплаты', desc: 'Реальные данные о зарплатах по должностям', href: '/salaries', color: 'bg-emerald-50 text-emerald-600', action: 'Добавить зарплату', actionHref: '/salaries/add' },
              { icon: Briefcase, title: 'Вакансии', desc: 'Работа в компаниях с реальными отзывами', href: '/jobs', color: 'bg-blue-50 text-blue-600', action: 'Разместить вакансию', actionHref: '/jobs/add' },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{card.desc}</p>
                <div className="flex gap-2">
                  <Link href={card.href} className="text-sm text-blue-600 hover:text-blue-800">Смотреть →</Link>
                  <Link href={card.actionHref} className="text-sm text-gray-400 hover:text-gray-600 ml-auto">{card.action}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Топ компании ──────────────────────────────── */}
      {(topCompanies.data?.length || 0) > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Лучшие работодатели</h2>
              <Link href="/search" className="text-sm text-blue-600 hover:text-blue-800">Все компании →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCompanies.data?.map((c: any) => (
                <Link key={c.id} href={`/company/${c.slug}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{c.name_ru}</div>
                        {c.city && <div className="text-xs text-gray-400">{c.city}</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(c.avg_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-sm font-medium text-gray-700 ml-1">{Number(c.avg_rating || 0).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-400">{c.reviews_count} отзывов</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Последние вакансии ────────────────────────── */}
      {(latestJobs.data?.length || 0) > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Свежие вакансии</h2>
              <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-800">Все вакансии →</Link>
            </div>
            <div className="space-y-3">
              {latestJobs.data?.map((job: any) => {
                const company = job.companies
                const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)
                const sym = currSym[job.salary_currency || 'KZT'] || '₸'
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {company && <span className="text-blue-600">{company.name_ru}</span>}
                          {job.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}</span>}
                          {job.employment_type && <span>{typeLabel[job.employment_type]}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{daysAgo === 0 ? 'сегодня' : `${daysAgo}д`}</span>
                        </div>
                      </div>
                      {(job.salary_from || job.salary_to) && (
                        <div className="text-sm font-semibold text-emerald-700 flex-shrink-0">
                          {job.salary_from ? `от ${fmt(job.salary_from)} ${sym}` : `до ${fmt(job.salary_to)} ${sym}`}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Последние отзывы ──────────────────────────── */}
      {(latestReviews.data?.length || 0) > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Свежие отзывы</h2>
              <Link href="/search" className="text-sm text-blue-600 hover:text-blue-800">Все компании →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {latestReviews.data?.map((r: any) => (
                <Link key={r.id} href={`/company/${(r.companies as any)?.slug}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all h-full">
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating_overall ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{r.title}</h3>
                    {r.pros && <p className="text-xs text-gray-500 line-clamp-3 mb-3">{r.pros}</p>}
                    <div className="text-xs text-blue-600 font-medium">{(r.companies as any)?.name_ru}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA для бизнеса ───────────────────────────── */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Вы работодатель?</h2>
          <p className="text-blue-100 mb-8">Размещайте вакансии, отвечайте на отзывы и управляйте репутацией компании на Lookout.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/business" className="bg-white text-blue-700 hover:bg-blue-50 font-medium px-6 py-3 rounded-xl text-sm transition-colors">
              Регистрация для бизнеса
            </Link>
            <Link href="/jobs/add" className="border border-white/40 hover:bg-white/10 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors">
              Разместить вакансию
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Как это работает ──────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Как работает Lookout</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Найдите компанию', desc: 'Поиск по названию. Смотрите рейтинги, отзывы сотрудников и данные о зарплатах.' },
              { n: '02', title: 'Читайте честные отзывы', desc: 'Реальные отзывы от сотрудников с плюсами, минусами и данными о зарплате.' },
              { n: '03', title: 'Принимайте решение', desc: 'Откликайтесь на вакансии и выбирайте работодателя на основе реальных данных.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
