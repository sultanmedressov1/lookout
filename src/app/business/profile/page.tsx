'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, Building2, ArrowLeft, AlertCircle, Camera } from 'lucide-react'
import Link from 'next/link'

const INDUSTRIES = ['IT и технологии','Банковская деятельность','Страхование','Розничная торговля','Производство','Строительство','Телекоммуникации','Образование','Медицина и фармацевтика','Транспорт и логистика','Нефть и газ','Финансы','Консалтинг','Маркетинг и реклама','Медиа','Юридические услуги','Недвижимость','Туризм','Другое']
const SIZES = ['1–10','11–50','51–200','201–500','501–1000','1000+']
const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Другой']
const REMOTE_POLICIES = ['Офис','Гибрид','Удалённо','На выбор сотрудника']
const YEARS = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i))
const BENEFITS_OPTIONS = ['Медицинская страховка','Стоматология','ДМС для семьи','Питание в офисе','Фитнес/спорт','Корпоративное обучение','Английский язык','Конференции и курсы','Годовой бонус','Квартальный бонус','Акции/опционы','Служебный транспорт','Парковка','Корпоративный телефон','Ноутбук','Гибкий график','Удалённая работа','Дополнительный отпуск']

export default function BusinessProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic'|'culture'|'benefits'>('basic')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name_ru: '', description: '', website: '', linkedin: '',
    industry_name: '', company_size: '', city: '', address: '',
    founded_year: '', remote_policy: '', mission: '',
    culture_description: '', hiring_process: '', avg_salary_range: '',
    benefits: [] as string[], perks_description: '',
  })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleBenefit = (b: string) => setForm(p => ({
    ...p, benefits: p.benefits.includes(b) ? p.benefits.filter(x => x !== b) : [...p.benefits, b]
  }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.type !== 'business') { router.push('/'); return }

      // Резолюция company_id — через метаданные или через API
      let cId = user.user_metadata?.company_id

      if (!cId) {
        // Вызываем ensure-company чтобы найти/создать компанию
        const res = await fetch('/api/business/ensure-company', { method: 'POST' })
        const data = await res.json()
        cId = data.company_id
      }

      if (!cId) {
        setError('Не удалось найти компанию. Попробуйте создать вакансию сначала.')
        setLoading(false)
        return
      }

      setCompanyId(cId)
      const { data: co } = await supabase.from('companies').select('*').eq('id', cId).single()
      if (co) setForm({
        name_ru: co.name_ru || '',
        description: co.description || '',
        website: co.website || '',
        linkedin: co.linkedin || '',
        industry_name: co.industry_name || '',
        company_size: co.company_size || '',
        city: co.city || '',
        address: co.address || '',
        founded_year: co.founded_year?.toString() || '',
        remote_policy: co.remote_policy || '',
        mission: co.mission || '',
        culture_description: co.culture_description || '',
        hiring_process: co.hiring_process || '',
        avg_salary_range: co.avg_salary_range || '',
        benefits: co.benefits || [],
        perks_description: co.perks_description || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  const uploadLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return }
    setUploadingLogo(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `companies/${companyId}/logo.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setLogoUrl(data.publicUrl + '?t=' + Date.now())
    }
    setUploadingLogo(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) { setError('ID компании не найден'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    const res = await fetch('/api/business/update-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        name_ru: form.name_ru || undefined,
        description: form.description || null,
        website: form.website || null,
        linkedin: form.linkedin || null,
        industry_name: form.industry_name || null,
        company_size: form.company_size || null,
        city: form.city || null,
        address: form.address || null,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        remote_policy: form.remote_policy || null,
        mission: form.mission || null,
        culture_description: form.culture_description || null,
        hiring_process: form.hiring_process || null,
        avg_salary_range: form.avg_salary_range || null,
        benefits: form.benefits.length > 0 ? form.benefits : null,
        perks_description: form.perks_description || null,
        logo_url: logoUrl || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(`Ошибка: ${data.error}`)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>

  const tabs = [{ id: 'basic' as const, label: 'Основное' },{ id: 'culture' as const, label: 'Культура' },{ id: 'benefits' as const, label: 'Льготы' }]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/business/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Профиль компании</h1>
              <p className="text-xs text-gray-500">Эти данные видят соискатели</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Логотип компании */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 mb-5">
          <div onClick={() => logoRef.current?.click()}
            className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center relative">
            {logoUrl
              ? <img src={logoUrl} alt="Логотип" className="w-full h-full object-contain p-1" />
              : <Building2 className="w-8 h-8 text-gray-400" />}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm mb-1">{form.name_ru || 'Логотип компании'}</p>
            <p className="text-xs text-gray-400 mb-2">PNG, JPG · до 5 МБ</p>
            <button type="button" onClick={() => logoRef.current?.click()}
              className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
              {logoUrl ? 'Изменить логотип' : 'Загрузить логотип'}
            </button>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {activeTab === 'basic' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <F label="Название компании *"><input value={form.name_ru} onChange={e => set('name_ru', e.target.value)} required className="inp" /></F>
              <F label="Описание"><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Чем занимается компания..." className="inp resize-none" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Отрасль"><select value={form.industry_name} onChange={e => set('industry_name', e.target.value)} className="inp bg-white"><option value="">Выберите...</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></F>
                <F label="Размер"><select value={form.company_size} onChange={e => set('company_size', e.target.value)} className="inp bg-white"><option value="">Выберите...</option>{SIZES.map(s => <option key={s} value={s}>{s} чел.</option>)}</select></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Город"><select value={form.city} onChange={e => set('city', e.target.value)} className="inp bg-white"><option value="">Выберите...</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></F>
                <F label="Год основания"><select value={form.founded_year} onChange={e => set('founded_year', e.target.value)} className="inp bg-white"><option value="">Год...</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></F>
              </div>
              <F label="Адрес"><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="ул. Достык 1, Алматы" className="inp" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Сайт"><input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://company.kz" className="inp" /></F>
                <F label="LinkedIn"><input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/company/..." className="inp" /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Формат работы"><select value={form.remote_policy} onChange={e => set('remote_policy', e.target.value)} className="inp bg-white"><option value="">Выберите...</option>{REMOTE_POLICIES.map(r => <option key={r} value={r}>{r}</option>)}</select></F>
                <F label="Вилка зарплат"><input value={form.avg_salary_range} onChange={e => set('avg_salary_range', e.target.value)} placeholder="200–800 тыс ₸" className="inp" /></F>
              </div>
            </div>
          )}

          {activeTab === 'culture' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <F label="Миссия компании"><textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={3} placeholder="Наша миссия..." className="inp resize-none" /></F>
              <F label="Культура и ценности"><textarea value={form.culture_description} onChange={e => set('culture_description', e.target.value)} rows={5} placeholder="Корпоративная культура, ценности, атмосфера..." className="inp resize-none" /></F>
              <F label="Процесс найма"><textarea value={form.hiring_process} onChange={e => set('hiring_process', e.target.value)} rows={4} placeholder="Этапы отбора, что входит в интервью..." className="inp resize-none" /></F>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Льготы и бенефиты</label>
                <div className="grid grid-cols-2 gap-2">
                  {BENEFITS_OPTIONS.map(b => (
                    <label key={b} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-colors ${form.benefits.includes(b) ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={form.benefits.includes(b)} onChange={() => toggleBenefit(b)} className="hidden" />
                      <span className="text-sm">{b}</span>
                    </label>
                  ))}
                </div>
              </div>
              <F label="Дополнительные привилегии"><textarea value={form.perks_description} onChange={e => set('perks_description', e.target.value)} rows={4} placeholder="Корпоративные поездки, ивенты, настольный теннис..." className="inp resize-none" /></F>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
            {saved ? 'Сохранено!' : saving ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
