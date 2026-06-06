'use client'

import { useState, useEffect } from 'react'
import { Send, CheckCircle2, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props { jobId: string; companyId: string; jobTitle: string; companyUserId?: string }

export default function ApplySection({ jobId, companyId, jobTitle, companyUserId }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isBusiness, setIsBusiness] = useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', cover_letter: '' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsBusiness(false); setCurrentUser(false); return }
      setCurrentUser(user)
      if (user.user_metadata?.type === 'business') { setIsBusiness(true); return }
      setIsBusiness(false)
      const { data: wp } = await supabase.from('worker_profiles').select('*').eq('user_id', user.id).single()
      if (wp) {
        setProfile(wp)
        setForm({ name: wp.full_name || user.user_metadata?.name || '', email: user.email || '', cover_letter: '' })
      } else {
        setForm({ name: user.user_metadata?.name || '', email: user.email || '', cover_letter: '' })
      }
    }
    load()
  }, [])

  if (isBusiness === null) return null
  if (isBusiness) return null

  // Не авторизован — показываем CTA регистрации
  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Send className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Войдите чтобы откликнуться</h3>
        <p className="text-sm text-gray-500 mb-4">Создайте аккаунт — это бесплатно и занимает 1 минуту</p>
        <div className="flex gap-3 justify-center">
          <a href="/auth/signup" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Зарегистрироваться
          </a>
          <a href="/auth/signin" className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Войти
          </a>
        </div>
      </div>
    )
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('job_applications').insert([{
        job_id: jobId, company_id: companyId,
        applicant_name: form.name, applicant_email: form.email,
        cover_letter: form.cover_letter || null,
        worker_profile_id: profile?.id || null,
        applicant_phone: profile?.phone || null,
        applicant_city: profile?.city || null,
        applicant_about: profile?.about || null,
        status: 'new',
      }])
      if (error) { alert(`Ошибка: ${error.message}`); return }

      if (companyUserId) {
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: companyUserId, type: 'new_application',
            title: `Новый отклик на «${jobTitle}»`,
            message: `${form.name} откликнулся на вашу вакансию`,
            link: `/business/applications/${jobId}`,
          }),
        }).catch(() => {})
      }
      setSubmitted(true)
    } catch { alert('Что-то пошло не так.') }
    finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-semibold text-emerald-900 mb-1">Отклик отправлен!</h3>
        <p className="text-sm text-emerald-700">Работодатель свяжется с вами по email <strong>{form.email}</strong></p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">Откликнуться на вакансию</div>
            {profile ? (
              <div className="text-xs text-emerald-600">Профиль заполнен — данные подставятся автоматически</div>
            ) : (
              <div className="text-xs text-gray-400">
                <Link href="/profile/edit" className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>Заполните профиль</Link>
                {' '}чтобы упростить отклик
              </div>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleApply} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-5">
          {profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
              <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 text-xs text-blue-700">
                <span className="font-medium">{profile.full_name}</span>
                {profile.current_position && <span> · {profile.current_position}</span>}
                {profile.city && <span> · {profile.city}</span>}
              </div>
              <Link href="/profile/edit" className="text-xs text-blue-600 hover:underline flex-shrink-0">Изменить</Link>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ваше имя *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Имя Фамилия"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Сопроводительное письмо <span className="text-gray-400 font-normal">— необязательно</span>
            </label>
            <textarea value={form.cover_letter} onChange={e => set('cover_letter', e.target.value)}
              rows={4} placeholder="Почему вы подходите для этой позиции..."
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Отправляем...' : 'Отправить отклик'}
          </button>
        </form>
      )}
    </div>
  )
}
