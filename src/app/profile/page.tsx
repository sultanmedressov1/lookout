import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, DollarSign, Briefcase, User, Edit, Phone, MapPin, GraduationCap } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  if (user.user_metadata?.type === 'business') redirect('/business/dashboard')

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь'

  const [reviewsRes, salariesRes, interviewsRes, profileRes] = await Promise.all([
    supabase.from('reviews_employee').select('id, title, rating_overall, created_at, companies(name_ru, slug)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('salaries').select('id, position_title, salary_monthly, created_at, companies(name_ru, slug)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reviews_interview').select('id, title, experience, created_at, companies(name_ru, slug)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('worker_profiles').select('*').eq('user_id', user.id).single(),
  ])

  const reviews = reviewsRes.data || []
  const salaries = salariesRes.data || []
  const interviews = interviewsRes.data || []
  const profile = profileRes.data

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M ₸`
    if (n >= 1_000) return `${Math.round(n/1_000)}K ₸`
    return `${n} ₸`
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Шапка профиля */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.full_name || name}</h1>
                {profile?.current_position && <p className="text-sm text-gray-500">{profile.current_position}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              </div>
            </div>
            <Link href="/profile/edit"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Edit className="w-4 h-4" /> Редактировать профиль
            </Link>
          </div>

          {/* Данные профиля */}
          {profile && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />{profile.phone}
                </div>
              )}
              {profile.city && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />{profile.city}
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400" />{profile.education}
                </div>
              )}
              {profile.experience_years && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />{profile.experience_years} лет опыта
                </div>
              )}
            </div>
          )}

          {!profile && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-400">
                Заполните профиль — работодатели увидят ваши данные при отклике.{' '}
                <Link href="/profile/edit" className="text-blue-600 hover:underline">Заполнить →</Link>
              </p>
            </div>
          )}

          {/* Счётчики */}
          <div className="mt-4 flex gap-6">
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{reviews.length}</div><div className="text-xs text-gray-400">отзывов</div></div>
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{salaries.length}</div><div className="text-xs text-gray-400">зарплат</div></div>
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{interviews.length}</div><div className="text-xs text-gray-400">интервью</div></div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { href: '/reviews/add', icon: Star, label: 'Написать отзыв', color: 'text-amber-600 bg-amber-50' },
            { href: '/salaries/add', icon: DollarSign, label: 'Добавить зарплату', color: 'text-emerald-600 bg-emerald-50' },
            { href: '/interviews/add', icon: Briefcase, label: 'Отзыв об интервью', color: 'text-blue-600 bg-blue-50' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${a.color}`}>
                <a.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* История */}
        {reviews.length > 0 && (
          <Section title="Мои отзывы">
            {reviews.map((r: any) => (
              <ItemRow key={r.id} company={r.companies} title={r.title} meta={`${r.rating_overall}/5 ★`} date={r.created_at} />
            ))}
          </Section>
        )}
        {salaries.length > 0 && (
          <Section title="Мои зарплаты">
            {salaries.map((s: any) => (
              <ItemRow key={s.id} company={s.companies} title={s.position_title} meta={fmt(s.salary_monthly)} date={s.created_at} />
            ))}
          </Section>
        )}
        {interviews.length > 0 && (
          <Section title="Отзывы об интервью">
            {interviews.map((i: any) => (
              <ItemRow key={i.id} company={i.companies} title={i.title}
                meta={i.experience === 'positive' ? '👍' : i.experience === 'negative' ? '👎' : '😐'}
                date={i.created_at} />
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">{title}</div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function ItemRow({ company, title, meta, date }: any) {
  const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {company && (
        <Link href={`/company/${company.slug}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex-shrink-0 max-w-[140px] truncate">
          {company.name_ru}
        </Link>
      )}
      <span className="text-sm text-gray-700 flex-1 truncate">{title}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{meta}</span>
      <span className="text-xs text-gray-300 flex-shrink-0">{daysAgo === 0 ? 'сегодня' : `${daysAgo}д`}</span>
    </div>
  )
}
