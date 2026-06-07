import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, MapPin, Briefcase, GraduationCap, ArrowLeft, Mail, Star, Globe, Send, ExternalLink, Calendar, CheckCircle2, FileText } from 'lucide-react'
import { ResumeDownload } from './ResumeDownload'

interface Props { params: { id: string } }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M ₸`
  return `${Math.round(n/1_000)} тыс ₸`
}

export default async function WorkerProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const admin = createAdminClient()

  const { data: profile } = await admin.from('worker_profiles').select('*').eq('id', params.id).single()
  if (!profile) notFound()

  const { data: userData } = await admin.auth.admin.getUserById(profile.user_id)
  const email = userData?.user?.email

  const [reviewsRes] = await Promise.all([
    admin.from('reviews_employee').select('id, title, rating_overall, created_at, companies(name_ru, short_id)')
      .eq('user_id', profile.user_id).eq('is_published', true).order('created_at', { ascending: false }),
  ])

  const reviews = reviewsRes.data || []
  const workExp: any[] = profile.work_experience || []

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="javascript:history.back()" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>

        {/* Шапка */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.photo_url
                ? <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-blue-600" />}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{profile.full_name || 'Кандидат'}</h1>
              {profile.current_position && <p className="text-sm text-gray-600 mt-0.5">{profile.current_position}</p>}
              {profile.about && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{profile.about}</p>}
            </div>
          </div>

          {/* Контакты */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div><div className="text-xs text-blue-500 font-medium">Email</div><div className="text-sm text-blue-900 font-medium">{email}</div></div>
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div><div className="text-xs text-emerald-500 font-medium">Телефон</div><div className="text-sm text-emerald-900 font-medium">{profile.phone}</div></div>
              </a>
            )}
            {profile.telegram && (
              <a href={`https://t.me/${profile.telegram.replace('@','')}`} target="_blank" className="flex items-center gap-2.5 p-3 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors">
                <Send className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <div><div className="text-xs text-sky-500 font-medium">Telegram</div><div className="text-sm text-sky-900 font-medium">{profile.telegram}</div></div>
              </a>
            )}
            {profile.github_portfolio && (
              <a href={profile.github_portfolio.startsWith('http') ? profile.github_portfolio : `https://${profile.github_portfolio}`} target="_blank" className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <div><div className="text-xs text-gray-500 font-medium">Портфолио</div><div className="text-sm text-gray-900 font-medium truncate">{profile.github_portfolio}</div></div>
              </a>
            )}
          </div>

          {/* Резюме */}
          {profile.resume_url && (
            <ResumeDownload resumePath={profile.resume_url} />
          )}

          {/* Основная информация */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.city && <Info icon={MapPin} label="Город" value={profile.city} />}
            {profile.experience_years && <Info icon={Briefcase} label="Опыт" value={profile.experience_years} />}
            {profile.education_level && <Info icon={GraduationCap} label="Образование" value={profile.education_level} />}
            {profile.availability && <Info icon={Calendar} label="Готовность" value={profile.availability} />}
          </div>
        </div>

        {/* Навыки */}
        {profile.skills && (
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
                    <div className="text-xs text-gray-400 mt-0.5">
                      {e.from_year}{e.current ? ' — по сей день' : e.to_year ? ` — ${e.to_year}` : ''}
                    </div>
                    {e.description && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Образование */}
        {profile.education && (
          <Section title="Образование">
            <p className="text-sm text-gray-700">{profile.education}</p>
          </Section>
        )}

        {/* Языки */}
        {profile.languages && (
          <Section title="Языки">
            <p className="text-sm text-gray-700">{profile.languages}</p>
          </Section>
        )}

        {/* Сертификаты */}
        {profile.certifications && (
          <Section title="Сертификаты и курсы">
            <p className="text-sm text-gray-700 leading-relaxed">{profile.certifications}</p>
          </Section>
        )}

        {/* Пожелания */}
        {(profile.desired_position || profile.desired_salary || profile.desired_city) && (
          <Section title="Пожелания к работе">
            <div className="grid sm:grid-cols-3 gap-3">
              {profile.desired_position && <div className="text-sm"><div className="text-xs text-gray-400 mb-0.5">Желаемая должность</div><div className="font-medium text-gray-900">{profile.desired_position}</div></div>}
              {profile.desired_salary && <div className="text-sm"><div className="text-xs text-gray-400 mb-0.5">Желаемая зарплата</div><div className="font-medium text-gray-900">{fmt(profile.desired_salary)}/мес</div></div>}
              {profile.desired_city && <div className="text-sm"><div className="text-xs text-gray-400 mb-0.5">Желаемый город</div><div className="font-medium text-gray-900">{profile.desired_city}</div></div>}
            </div>
          </Section>
        )}

        {/* Отзывы о работодателях */}
        {reviews.length > 0 && (
          <Section title="Отзывы о работодателях">
            <div className="space-y-2">
              {reviews.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-none">
                  {r.companies && (
                    <Link href={`/company/${(r.companies as any).short_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 min-w-[140px] truncate">
                      {(r.companies as any).name_ru}
                    </Link>
                  )}
                  <span className="text-sm text-gray-600 flex-1 truncate">{r.title}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-gray-700">{r.rating_overall}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <h2 className="font-semibold text-gray-900 text-sm mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div><div className="text-xs text-gray-400">{label}</div><div className="text-sm font-medium text-gray-900">{value}</div></div>
    </div>
  )
}
