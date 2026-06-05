import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, MapPin, Briefcase, GraduationCap, ArrowLeft, Mail, Star } from 'lucide-react'

interface Props { params: { id: string } }

export default async function WorkerProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const admin = createAdminClient()

  // Загружаем профиль
  const { data: profile } = await admin
    .from('worker_profiles').select('*').eq('id', params.id).single()
  if (!profile) notFound()

  // Загружаем email пользователя
  const { data: userData } = await admin.auth.admin.getUserById(profile.user_id)
  const email = userData?.user?.email

  // Отзывы и зарплаты этого пользователя (публичные данные)
  const [reviewsRes, salariesRes] = await Promise.all([
    admin.from('reviews_employee').select('id, title, rating_overall, created_at, companies(name_ru, slug)')
      .eq('user_id', profile.user_id).eq('is_published', true).order('created_at', { ascending: false }),
    admin.from('salaries').select('id, position_title, salary_monthly, created_at')
      .eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5),
  ])

  const reviews = reviewsRes.data || []

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M ₸`
    return `${Math.round(n/1_000)}K ₸`
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="javascript:history.back()" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> Назад
        </Link>

        {/* Основной профиль */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{profile.full_name || 'Кандидат'}</h1>
              {profile.current_position && <p className="text-sm text-gray-600 mt-0.5">{profile.current_position}</p>}
              {profile.experience_years && (
                <p className="text-xs text-gray-400 mt-0.5">{profile.experience_years} {profile.experience_years === 1 ? 'год' : profile.experience_years < 5 ? 'года' : 'лет'} опыта</p>
              )}
            </div>
          </div>

          {/* Контакты */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-blue-500 font-medium">Email</div>
                  <div className="text-sm text-blue-900 font-medium">{email}</div>
                </div>
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-emerald-500 font-medium">Телефон</div>
                  <div className="text-sm text-emerald-900 font-medium">{profile.phone}</div>
                </div>
              </a>
            )}
          </div>

          {/* Детали */}
          <div className="space-y-3">
            {profile.city && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div><div className="text-xs text-gray-400">Город</div><div className="text-sm text-gray-700">{profile.city}</div></div>
              </div>
            )}
            {profile.education && (
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div><div className="text-xs text-gray-400">Образование</div><div className="text-sm text-gray-700">{profile.education}</div></div>
              </div>
            )}
            {profile.skills && (
              <div className="flex items-start gap-2.5">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Навыки</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.split(',').map((s: string) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {profile.about && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1.5">О себе</div>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.about}</p>
              </div>
            )}
          </div>
        </div>

        {/* Отзывы о работодателях */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Отзывы о работодателях</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {reviews.map((r: any) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                  {r.companies && (
                    <Link href={`/company/${r.companies.slug}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex-shrink-0 max-w-[180px] truncate">
                      {r.companies.name_ru}
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
          </div>
        )}
      </div>
    </div>
  )
}
