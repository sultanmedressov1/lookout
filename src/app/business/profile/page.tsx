'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, Building2 } from 'lucide-react'

const INDUSTRIES = ['IT и технологии','Банковская деятельность','Розничная торговля','Производство','Строительство','Телекоммуникации','Образование','Медицина','Транспорт','Нефть и газ','Финансы','Другое']
const SIZES = ['1–10','11–50','51–200','201–500','501–1000','1000+']
const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Другой']

export default function BusinessProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    name_ru: '', description: '', website: '', industry_name: '',
    company_size: '', city: '', founded_year: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.type !== 'business') { router.push('/'); return }
      setUser(user)

      const companyId = user.user_metadata?.company_id
      if (companyId) {
        const { data: co } = await supabase.from('companies').select('*').eq('id', companyId).single()
        if (co) setForm({
          name_ru: co.name_ru || '',
          description: co.description || '',
          website: co.website || '',
          industry_name: co.industry_name || '',
          company_size: co.company_size || '',
          city: co.city || '',
          founded_year: co.registration_date ? new Date(co.registration_date).getFullYear().toString() : '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const companyId = user?.user_metadata?.company_id
    if (!companyId) return

    await supabase.from('companies').update({
      name_ru: form.name_ru || undefined,
      description: form.description || null,
      website: form.website || null,
      industry_name: form.industry_name || null,
      company_size: form.company_size || null,
      city: form.city || null,
    }).eq('id', companyId)

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
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Профиль компании</h1>
            <p className="text-xs text-gray-500">Эти данные видят соискатели</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <F label="Название компании *">
            <input value={form.name_ru} onChange={e => set('name_ru', e.target.value)} required
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
          </F>
          <F label="Описание">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Расскажите о компании, её миссии и культуре..."
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Сайт">
              <input value={form.website} onChange={e => set('website', e.target.value)}
                placeholder="https://company.kz"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </F>
            <F label="Город">
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Выберите...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Отрасль">
              <select value={form.industry_name} onChange={e => set('industry_name', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Выберите...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </F>
            <F label="Размер компании">
              <select value={form.company_size} onChange={e => set('company_size', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Выберите...</option>
                {SIZES.map(s => <option key={s} value={s}>{s} сотрудников</option>)}
              </select>
            </F>
          </div>
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
            {saved ? 'Сохранено!' : saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}

function F({ label, children }: any) {
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
