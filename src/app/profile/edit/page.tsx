'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, User } from 'lucide-react'

const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Другой']

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', city: '', about: '',
    education: '', experience_years: '', current_position: '', skills: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/signin'); return }
      if (user.user_metadata?.type === 'business') { router.push('/business/dashboard'); return }

      const { data: profile } = await supabase
        .from('worker_profiles').select('*').eq('user_id', user.id).single()

      if (profile) {
        setForm({
          full_name: profile.full_name || user.user_metadata?.name || '',
          phone: profile.phone || '',
          city: profile.city || '',
          about: profile.about || '',
          education: profile.education || '',
          experience_years: profile.experience_years?.toString() || '',
          current_position: profile.current_position || '',
          skills: profile.skills || '',
        })
      } else {
        setForm(p => ({ ...p, full_name: user.user_metadata?.name || '' }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      user_id: user.id,
      full_name: form.full_name || null,
      phone: form.phone || null,
      city: form.city || null,
      about: form.about || null,
      education: form.education || null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      current_position: form.current_position || null,
      skills: form.skills || null,
      updated_at: new Date().toISOString(),
    }

    await supabase.from('worker_profiles').upsert(data, { onConflict: 'user_id' })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Мой профиль</h1>
            <p className="text-xs text-gray-500">Эти данные видят работодатели при отклике</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <Section title="Основное">
            <Field label="Имя и фамилия">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Айгерим Сейткали"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Телефон">
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+7 777 000 00 00"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>
              <Field label="Город">
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Опыт">
            <Field label="Текущая/последняя должность">
              <input value={form.current_position} onChange={e => set('current_position', e.target.value)}
                placeholder="Frontend Developer"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </Field>
            <Field label="Лет опыта">
              <input type="number" min="0" max="50" value={form.experience_years} onChange={e => set('experience_years', e.target.value)}
                placeholder="3"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </Field>
            <Field label="Навыки (через запятую)">
              <input value={form.skills} onChange={e => set('skills', e.target.value)}
                placeholder="React, TypeScript, Node.js"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </Field>
          </Section>

          <Section title="Образование и о себе">
            <Field label="Образование">
              <input value={form.education} onChange={e => set('education', e.target.value)}
                placeholder="КазНУ, Информационные системы, 2020"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </Field>
            <Field label="О себе">
              <textarea value={form.about} onChange={e => set('about', e.target.value)}
                rows={3} placeholder="Расскажите о себе кратко..."
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
            </Field>
          </Section>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
            {saved ? 'Сохранено!' : saving ? 'Сохраняем...' : 'Сохранить профиль'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: any) {
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
