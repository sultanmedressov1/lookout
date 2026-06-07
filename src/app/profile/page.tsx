import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, DollarSign, Briefcase, User, Edit, Phone, MapPin, GraduationCap, Send, ExternalLink, Globe, CheckCircle2, Calendar } from 'lucide-react'
import { ResumeButton } from './ResumeButton'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  if (user.user_metadata?.type === 'business') redirect('/business/dashboard')

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь'

  const [reviewsRes, salariesRes, interviewsRes, profileRes] = await Promise.all([
    supabase.from('reviews_employee').select('id, title, rating_overall, created_at, companies(name_ru, short_id)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('salaries').select('id, position_title, salary_monthly, created_at, companies(name_ru, short_id)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reviews_interview').select('id, title, experience, created_at, companies(name_ru, short_id)')
      .eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('worker_profiles').select('*').eq('user_id', user.id).single(),
  ])

  const reviews = reviewsRes.data || []
  const salaries = salariesRes.data || []
  const interviews = interviewsRes.data || []
  const profile = profileRes.data
  const workExp: any[] = profile?.work_experience || []

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M ₸`
    if (n >= 1_000) return `${Math.round(n/1_000)}K ₸`
    return `${n} ₸`
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Шапка профиля */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.photo_url
                  ? <img src={profile.photo_url} alt="Фото" className="w-full h-full object-cover" />
                  : <User className="w-8 h-8 text-blue-600" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.full_name || name}</h1>
                {profile?.current_position && <p className="text-sm text-gray-500">{profile.current_position}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.resume_url && <ResumeButton resumePath={profile.resume_url} />}
              <Link href="/profile/edit"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <Edit className="w-4 h-4" /> Редактировать
              </Link>
            </div>
          </div>

          {profile?.about && <p className="text-sm text-gray-600 leading-relaxed mb-4">{profile.about}</p>}

          {/* Контакты и основные данные */}
          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {profile.phone && <InfoBadge icon={Phone} label="Телефон" value={profile.phone} />}
              {profile.city && <InfoBadge icon={MapPin} label="Город" value={profile.city} />}
              {profile.experience_years && <InfoBadge icon={Briefcase} label="Опыт" value={`${profile.experience_years} лет`} />}
              {profile.education_level && <InfoBadge icon={GraduationCap} label="Образование" value={profile.education_level} />}
              {profile.telegram && <InfoBadge icon={Send} label="Telegram" value={profile.telegram} />}
              {profile.github_portfolio && <InfoBadge icon={ExternalLink} label="Портфолио" value={profile.github_portfolio} href={profile.github_portfolio} />}
            </div>
          )}

          {/* Счётчики активности */}
          <div className="flex gap-6 pt-4 border-t border-gray-100">
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{reviews.length}</div><div className="text-xs text-gray-400">отзывов</div></div>
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{salaries.length}</div><div className="text-xs text-gray-400">зарплат</div></div>
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{interviews.length}</div><div className="text-xs text-gray-400">интервью</div></div>
            <div className="text-center"><div className="text-lg font-bold text-gray-900">{workExp.length}</div><div className="text-xs text-gray-400">мест работы</div></div>
          </div>
        </div>

        {/* Навыки */}
        {profile?.skills && (
          <Section title="Навыки">
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').map((s: string) => (
                <span key={s} className="text-sm bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">{s.trim()}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Опыт работы */}
        {workExp.length > 0 && (
          <Section title="Опыт работы">
            <div className="space-y-4">
              {workExp.map((e: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    {i < workExp.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium text-gray-900 text-sm">{e.position}</div>
                    <div className="text-sm text-blue-600">{e.company}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{e.from_year}{e.current ? ' — по сей день' : e.to_year ? ` — ${e.to_year}` : ''}</div>
                    {e.description && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Образование и языки */}
        {(profile?.education || profile?.education_level || profile?.languages) && (
          <Section title="Образование и языки">
            <div className="space-y-3">
              {profile.education && <div className="text-sm"><span className="text-gray-400">Учебное заведение: </span><span className="text-gray-900">{profile.education}</span></div>}
              {profile.languages && <div className="text-sm"><span className="text-gray-400">Языки: </span><span className="text-gray-900">{profile.languages}</span></div>}
              {profile.certifications && <div className="text-sm"><span className="text-gray-400">Курсы: </span><span className="text-gray-900">{profile.certifications}</span></div>}
            </div>
          </Section>
        )}

        {/* Пожелания */}
        {(profile?.desired_position || profile?.desired_salary || profile?.availability) && (
          <Section title="Пожелания к работе">
            <div className="grid sm:grid-cols-3 gap-3">
              {profile.desired_position && <div className="text-sm"><div className="text-xs text-gray-400 mb-1">Желаемая должность</div><div className="font-medium text-gray-900">{profile.desired_position}</div></div>}
              {profile.desired_salary && <div className="text-sm"><div className="text-xs text-gray-400 mb-1">Желаемая зарплата</div><div className="font-medium text-gray-900">{fmt(profile.desired_salary)}/мес</div></div>}
              {profile.availability && <div className="text-sm"><div className="text-xs text-gray-400 mb-1">Готовность</div><div className="font-medium text-gray-900">{profile.availability}</div></div>}
            </div>
          </Section>
        )}

        {/* Нет профиля */}
        {!profile && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-5">
            <p className="text-sm text-gray-400 mb-4">Профиль не заполнен. Заполните — работодатели увидят ваши данные при отклике.</p>
            <Link href="/profile/edit" className="text-sm text-blue-600 hover:underline">Заполнить профиль →</Link>
          </div>
        )}

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 mb-5">
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
        {reviews.length > 0 && <ActivitySection title="Мои отзывы" items={reviews.map((r: any) => ({ company: r.companies, title: r.title, meta: `${r.rating_overall}/5 ★`, date: r.created_at }))} />}
        {salaries.length > 0 && <ActivitySection title="Мои зарплаты" items={salaries.map((s: any) => ({ company: s.companies, title: s.position_title, meta: fmt(s.salary_monthly), date: s.created_at }))} />}
        {interviews.length > 0 && <ActivitySection title="Отзывы об интервью" items={interviews.map((i: any) => ({ company: i.companies, title: i.title, meta: i.experience === 'positive' ? '+' : i.experience === 'negative' ? '-' : '~', date: i.created_at }))} />}
      </div>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <h2 className="font-semibold text-gray-900 text-sm mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function InfoBadge({ icon: Icon, label, value, href }: any) {
  const content = (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-gray-800 font-medium truncate">{value}</div>
      </div>
    </div>
  )
  return href ? <a href={href.startsWith('http') ? href : `https://${href}`} target="_blank" className="hover:bg-gray-50 rounded-lg p-1 -m-1 block">{content}</a> : <div>{content}</div>
}

function ActivitySection({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">{title}</div>
      <div className="divide-y divide-gray-50">
        {items.map((item, i) => {
          const daysAgo = Math.floor((Date.now() - new Date(item.date).getTime()) / 86400000)
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              {item.company && (
                <Link href={`/company/${item.company.short_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex-shrink-0 max-w-[140px] truncate">
                  {item.company.name_ru}
                </Link>
              )}
              <span className="text-sm text-gray-700 flex-1 truncate">{item.title}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{item.meta}</span>
              <span className="text-xs text-gray-300 flex-shrink-0">{daysAgo === 0 ? 'сегодня' : `${daysAgo}д`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
