import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, DollarSign, MessageSquare, Briefcase, User } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь'
  const isBusiness = user.user_metadata?.type === 'business'

  if (isBusiness) redirect('/business/dashboard')

  const [reviewsRes, salariesRes, interviewsRes] = await Promise.all([
    supabase.from('reviews_employee').select('id, title, rating_overall, created_at, companies(name_ru, bin)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('salaries').select('id, position_title, salary_monthly, created_at, companies(name_ru, bin)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reviews_interview').select('id, title, experience, created_at, companies(name_ru, bin)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const reviews = reviewsRes.data || []
  const salaries = salariesRes.data || []
  const interviews = interviewsRes.data || []

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)} млн ₸`
    if (n >= 1_000) return `${Math.round(n/1_000)} тыс ₸`
    return `${n} ₸`
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Шапка */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="ml-auto flex gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{reviews.length}</div>
              <div className="text-xs text-gray-400">отзывов</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{salaries.length}</div>
              <div className="text-xs text-gray-400">зарплат</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{interviews.length}</div>
              <div className="text-xs text-gray-400">интервью</div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { href: '/reviews/add', icon: Star, label: 'Написать отзыв', color: 'text-amber-600 bg-amber-50' },
            { href: '/salaries/add', icon: DollarSign, label: 'Добавить зарплату', color: 'text-emerald-600 bg-emerald-50' },
            { href: '/interviews/add', icon: Briefcase, label: 'Отзыв об интервью', color: 'text-blue-600 bg-blue-50' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${a.color}`}>
                <a.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Мои отзывы */}
        {reviews.length > 0 && (
          <Section title="Мои отзывы" icon={Star}>
            {reviews.map((r: any) => (
              <ItemRow key={r.id}
                company={r.companies}
                title={r.title}
                meta={`${r.rating_overall}/5 ★`}
                date={r.created_at} />
            ))}
          </Section>
        )}

        {/* Мои зарплаты */}
        {salaries.length > 0 && (
          <Section title="Мои зарплаты" icon={DollarSign}>
            {salaries.map((s: any) => (
              <ItemRow key={s.id}
                company={s.companies}
                title={s.position_title}
                meta={`${fmt(s.salary_monthly)}/мес`}
                date={s.created_at} />
            ))}
          </Section>
        )}

        {/* Мои интервью */}
        {interviews.length > 0 && (
          <Section title="Отзывы об интервью" icon={Briefcase}>
            {interviews.map((i: any) => (
              <ItemRow key={i.id}
                company={i.companies}
                title={i.title}
                meta={i.experience === 'positive' ? '👍 Позитивное' : i.experience === 'negative' ? '👎 Негативное' : '😐 Нейтральное'}
                date={i.created_at} />
            ))}
          </Section>
        )}

        {reviews.length === 0 && salaries.length === 0 && interviews.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Вы ещё ничего не добавили</h3>
            <p className="text-sm text-gray-400 mb-4">Поделитесь своим опытом — помогите другим</p>
            <Link href="/reviews/add" className="text-sm text-blue-600 hover:text-blue-800">
              Написать первый отзыв →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-400" />
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function ItemRow({ company, title, meta, date }: any) {
  const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {company && (
        <Link href={`/company/${company.bin}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 min-w-0 truncate flex-shrink-0 max-w-[140px]">
          {company.name_ru}
        </Link>
      )}
      <span className="text-sm text-gray-700 flex-1 truncate">{title}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{meta}</span>
      <span className="text-xs text-gray-300 flex-shrink-0">{daysAgo === 0 ? 'сегодня' : `${daysAgo}д`}</span>
    </div>
  )
}
