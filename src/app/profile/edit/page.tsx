'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, User, Plus, Trash2, ArrowLeft, Camera, FileText, Upload } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Другой']
const EDUCATION_LEVELS = ['Среднее','Среднее специальное','Неоконченное высшее','Бакалавр','Магистр','MBA','Доктор PhD']
const AVAILABILITY = ['Готов приступить немедленно','В течение 1 недели','В течение 1 месяца','Через 2–3 месяца','Рассматриваю предложения']
const EXPERIENCE_YEARS = ['Без опыта','До 1 года','1–3 года','3–6 лет','5–10 лет','Более 10 лет']

type WorkEntry = { company: string; position: string; from_year: string; to_year: string; current: boolean; description: string }

export default function ProfileEditPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'main'|'career'|'preferences'>('main')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [resumeUrl, setResumeUrl] = useState<string>('')
  const [resumeName, setResumeName] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const resumeRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '', phone: '', city: '', about: '',
    education: '', education_level: '', experience_years: '',
    current_position: '', skills: '',
    telegram: '', github_portfolio: '', languages: '',
    certifications: '', desired_position: '', desired_salary: '',
    desired_city: '', availability: '',
  })
  const [workExp, setWorkExp] = useState<WorkEntry[]>([])
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/signin'); return }
      if (user.user_metadata?.type === 'business') { router.push('/business/dashboard'); return }
      setUserId(user.id)

      const { data: p } = await supabase.from('worker_profiles').select('*').eq('user_id', user.id).single()
      if (p) {
        setForm({
          full_name: p.full_name || user.user_metadata?.name || '',
          phone: p.phone || '', city: p.city || '', about: p.about || '',
          education: p.education || '', education_level: p.education_level || '',
          experience_years: p.experience_years?.toString() || '',
          current_position: p.current_position || '', skills: p.skills || '',
          telegram: p.telegram || '', github_portfolio: p.github_portfolio || '',
          languages: p.languages || '', certifications: p.certifications || '',
          desired_position: p.desired_position || '',
          desired_salary: p.desired_salary?.toString() || '',
          desired_city: p.desired_city || '', availability: p.availability || '',
        })
        setWorkExp(p.work_experience || [])
        setPhotoUrl(p.photo_url || '')
        setResumeUrl(p.resume_url || '')
        if (p.resume_url) setResumeName(p.resume_url.split('/').pop()?.replace(/^[^.]+\./, 'resume.') || 'resume.pdf')
      } else {
        setForm(f => ({ ...f, full_name: user.user_metadata?.name || '' }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const uploadPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return }
    setUploadingPhoto(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `workers/${userId}/photo.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setPhotoUrl(data.publicUrl + '?t=' + Date.now())
    }
    setUploadingPhoto(false)
  }

  const uploadResume = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('Максимум 10 МБ'); return }
    setUploadingResume(true)
    const supabase = createClient()
    const path = `${userId}/resume.pdf`
    const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
    if (!error) { setResumeUrl(path); setResumeName(file.name) }
    setUploadingResume(false)
  }

  const addWork = () => setWorkExp(p => [...p, { company: '', position: '', from_year: '', to_year: '', current: false, description: '' }])
  const removeWork = (i: number) => setWorkExp(p => p.filter((_, idx) => idx !== i))
  const setWork = (i: number, k: keyof WorkEntry, v: any) => setWorkExp(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('worker_profiles').upsert({
      user_id: user.id,
      full_name: form.full_name || null, phone: form.phone || null, city: form.city || null,
      about: form.about || null, education: form.education || null, education_level: form.education_level || null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      current_position: form.current_position || null, skills: form.skills || null,
      telegram: form.telegram || null, github_portfolio: form.github_portfolio || null,
      languages: form.languages || null, certifications: form.certifications || null,
      desired_position: form.desired_position || null,
      desired_salary: form.desired_salary ? parseInt(form.desired_salary.replace(/\D/g,'')) : null,
      desired_city: form.desired_city || null, availability: form.availability || null,
      work_experience: workExp.filter(e => e.company || e.position),
      photo_url: photoUrl || null,
      resume_url: resumeUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>

  const tabs = [{ id: 'main' as const, label: 'Личные данные' },{ id: 'career' as const, label: 'Опыт' },{ id: 'preferences' as const, label: 'Пожелания' }]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Мой профиль</h1>
              <p className="text-xs text-gray-500">Работодатели видят эти данные при отклике</p>
            </div>
          </div>
        </div>

        {/* Фото + резюме */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 flex items-center gap-6 flex-wrap">
          {/* Аватар */}
          <div className="relative">
            <div onClick={() => photoRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center">
              {photoUrl
                ? <img src={photoUrl} alt="Фото" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-gray-400" />}
            </div>
            <button type="button" onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{form.full_name || 'Ваше имя'}</h3>
            <p className="text-xs text-gray-400 mb-3">Нажмите на фото чтобы изменить</p>

            {/* Резюме */}
            <div className="flex items-center gap-3">
              {resumeName ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-700">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{resumeName}</span>
                  <button type="button" onClick={() => { setResumeUrl(''); setResumeName('') }} className="text-emerald-400 hover:text-emerald-700">×</button>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Резюме не загружено</span>
              )}
              <button type="button" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 disabled:opacity-50">
                {uploadingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {resumeName ? 'Обновить' : 'Загрузить'} резюме (PDF)
              </button>
              <input ref={resumeRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadResume(e.target.files[0])} />
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {tab === 'main' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <F label="Имя и фамилия"><input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Айгерим Сейткали" className="inp" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Телефон"><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 777 000 00 00" className="inp" /></F>
                <F label="Telegram"><input value={form.telegram} onChange={e => set('telegram', e.target.value)} placeholder="@username" className="inp" /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Город">
                  <select value={form.city} onChange={e => set('city', e.target.value)} className="inp bg-white">
                    <option value="">Выберите...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>
                <F label="GitHub / Портфолио"><input value={form.github_portfolio} onChange={e => set('github_portfolio', e.target.value)} placeholder="github.com/username" className="inp" /></F>
              </div>
              <F label="Текущая должность"><input value={form.current_position} onChange={e => set('current_position', e.target.value)} placeholder="Frontend Developer" className="inp" /></F>
              <F label="Навыки (через запятую)"><input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, TypeScript, Node.js" className="inp" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Опыт работы">
                  <select value={form.experience_years} onChange={e => set('experience_years', e.target.value)} className="inp bg-white">
                    <option value="">Выберите...</option>
                    {EXPERIENCE_YEARS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </F>
                <F label="Уровень образования">
                  <select value={form.education_level} onChange={e => set('education_level', e.target.value)} className="inp bg-white">
                    <option value="">Выберите...</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </F>
              </div>
              <F label="Учебное заведение и специальность"><input value={form.education} onChange={e => set('education', e.target.value)} placeholder="КазНУ, Информационные системы, 2020" className="inp" /></F>
              <F label="Языки"><input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="Казахский (родной), Русский (C2), Английский (B2)" className="inp" /></F>
              <F label="Сертификаты и курсы"><textarea value={form.certifications} onChange={e => set('certifications', e.target.value)} rows={2} placeholder="AWS Certified, Coursera ML..." className="inp resize-none" /></F>
              <F label="О себе"><textarea value={form.about} onChange={e => set('about', e.target.value)} rows={3} placeholder="Краткое резюме о себе..." className="inp resize-none" /></F>
            </div>
          )}

          {tab === 'career' && (
            <div className="space-y-4">
              {workExp.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  Добавьте места работы
                </div>
              )}
              {workExp.map((entry, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 text-sm">Место работы {i + 1}</h3>
                    <button type="button" onClick={() => removeWork(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Компания"><input value={entry.company} onChange={e => setWork(i, 'company', e.target.value)} placeholder="Kaspi Bank" className="inp" /></F>
                      <F label="Должность"><input value={entry.position} onChange={e => setWork(i, 'position', e.target.value)} placeholder="Product Manager" className="inp" /></F>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-end">
                      <F label="С года"><input type="number" value={entry.from_year} onChange={e => setWork(i, 'from_year', e.target.value)} placeholder="2020" className="inp" /></F>
                      <F label="По год"><input type="number" value={entry.to_year} onChange={e => setWork(i, 'to_year', e.target.value)} placeholder="2023" disabled={entry.current} className="inp disabled:bg-gray-50" /></F>
                      <label className="flex items-center gap-2 cursor-pointer pb-3">
                        <input type="checkbox" checked={entry.current} onChange={e => setWork(i, 'current', e.target.checked)} className="rounded" />
                        <span className="text-sm text-gray-600">По сей день</span>
                      </label>
                    </div>
                    <F label="Обязанности и достижения"><textarea value={entry.description} onChange={e => setWork(i, 'description', e.target.value)} rows={2} placeholder="Чем занимались, чего достигли..." className="inp resize-none" /></F>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addWork}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <Plus className="w-4 h-4" /> Добавить место работы
              </button>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <F label="Желаемая должность"><input value={form.desired_position} onChange={e => set('desired_position', e.target.value)} placeholder="Senior Frontend Developer" className="inp" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Желаемая зарплата (₸/мес)"><input value={form.desired_salary} onChange={e => set('desired_salary', e.target.value)} placeholder="500 000" className="inp" /></F>
                <F label="Желаемый город">
                  <select value={form.desired_city} onChange={e => set('desired_city', e.target.value)} className="inp bg-white">
                    <option value="">Выберите...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>
              </div>
              <F label="Готовность к работе">
                <select value={form.availability} onChange={e => set('availability', e.target.value)} className="inp bg-white">
                  <option value="">Выберите...</option>
                  {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </F>
            </div>
          )}

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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
