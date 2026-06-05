'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ChevronRight, ChevronLeft, Briefcase, Building2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = ['IT и разработка','Менеджмент','Продажи','Маркетинг','Финансы','HR','Операции','Дизайн','Аналитика','Другое']
const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Кызылорда','Уральск','Петропавловск','Актау']

function JobAddContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [jobId, setJobId] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', requirements: '', nice_to_have: '',
    category: '', employment_type: 'full-time', experience_level: 'any',
    salary_from: '', salary_to: '', salary_visible: true, salary_currency: 'KZT',
    city: '', is_remote: false, contact_email: '', contact_name: '',
  })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user?.user_metadata?.type === 'business') {
        const res = await fetch('/api/business/ensure-company', { method: 'POST' })
        const data = await res.json()
        if (data.company_id) {
          setCompanyId(data.company_id)
        } else {
          console.error('ensure-company failed:', data.error)
        }
        setForm(p => ({
          ...p,
          contact_name: user.user_metadata?.contact_name || '',
          contact_email: user.email || '',
        }))
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!companyId) { alert('Не удалось определить компанию. Обратитесь в поддержку.'); return }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('jobs').insert([{
        company_id: companyId,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        nice_to_have: form.nice_to_have || null,
        category: form.category || null,
        employment_type: form.employment_type,
        experience_level: form.experience_level,
        salary_from: form.salary_from ? parseInt(form.salary_from.replace(/\D/g,'')) : null,
        salary_to: form.salary_to ? parseInt(form.salary_to.replace(/\D/g,'')) : null,
        salary_visible: form.salary_visible,
        salary_currency: form.salary_currency,
        city: form.city || null,
        is_remote: form.is_remote,
        contact_email: form.contact_email || null,
        contact_name: form.contact_name || null,
        is_active: true,
      }]).select('id').single()

      if (error) { alert(`Ошибка: ${error.message}`); return }
      setJobId(data.id)
      setSubmitted(true)
    } catch (err) { alert('Что-то пошло не так.') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>

  if (!user || user.user_metadata?.type !== 'business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Только для бизнеса</h2>
          <p className="text-gray-500 text-sm mb-6">Для размещения вакансий нужен бизнес-аккаунт.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/business" className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Регистрация бизнеса</Link>
            <Link href="/auth/signin" className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Войти</Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Вакансия опубликована!</h2>
          <p className="text-gray-500 text-sm mb-6">Соискатели уже могут её найти на Lookout.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/jobs/${jobId}`} className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Посмотреть</Link>
            <Link href="/business/dashboard" className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Панель</Link>
          </div>
        </div>
      </div>
    )
  }

  const companyName = user.user_metadata?.company_name
  const steps = [{n:1,l:'Вакансия'},{n:2,l:'Условия'},{n:3,l:'Контакт'}]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Новая вакансия</h1>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full">
            <Building2 className="w-3.5 h-3.5" /> {companyName}
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > s.n ? 'bg-blue-600 text-white' : step === s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${step === s.n ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s.l}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-12 mx-1 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card title="О вакансии">
            <div className="space-y-4 mb-6">
              <Field label="Название *"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Frontend Developer..." className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" /></Field>
              <Field label="Категория">
                <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Описание *"><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Чем будет заниматься сотрудник..." className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" /></Field>
              <Field label="Требования"><textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={3} placeholder="Опыт, навыки..." className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" /></Field>
              <Field label="Будет плюсом"><textarea value={form.nice_to_have} onChange={e => set('nice_to_have', e.target.value)} rows={2} placeholder="Дополнительные преимущества..." className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" /></Field>
            </div>
            <Nav onNext={() => setStep(2)} nextDisabled={!form.title.trim() || !form.description.trim()} nextLabel="Далее" />
          </Card>
        )}

        {step === 2 && (
          <Card title="Условия работы">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Тип занятости">
                  <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="full-time">Полная ставка</option>
                    <option value="part-time">Частичная</option>
                    <option value="contract">Контракт</option>
                    <option value="intern">Стажировка</option>
                    <option value="remote">Удалённо</option>
                  </select>
                </Field>
                <Field label="Уровень">
                  <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="any">Любой</option>
                    <option value="intern">Стажёр</option>
                    <option value="junior">Junior</option>
                    <option value="middle">Middle</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </Field>
              </div>
              <Field label="Зарплата">
                <div className="flex gap-2 mb-2">
                  <select value={form.salary_currency} onChange={e => set('salary_currency', e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-blue-400 w-24">
                    <option value="KZT">₸ KZT</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                  <input value={form.salary_from} onChange={e => set('salary_from', e.target.value)} placeholder="от" className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                  <input value={form.salary_to} onChange={e => set('salary_to', e.target.value)} placeholder="до" className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.salary_visible} onChange={e => set('salary_visible', e.target.checked)} className="rounded" />
                  <span className="text-xs text-gray-500">Показывать зарплату</span>
                </label>
              </Field>
              <Field label="Город">
                <select value={form.city} onChange={e => set('city', e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_remote} onChange={e => set('is_remote', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Возможна удалённая работа</span>
              </label>
            </div>
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Далее" />
          </Card>
        )}

        {step === 3 && (
          <Card title="Контакт для откликов">
            <div className="space-y-4 mb-6">
              <Field label="Email *"><input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="hr@company.kz" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" /></Field>
              <Field label="Имя контактного лица"><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Айгерим, HR Manager" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" /></Field>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">Вакансия будет активна 30 дней рядом с отзывами о вашей компании.</div>
            </div>
            <Nav onBack={() => setStep(2)} onNext={handleSubmit} nextDisabled={!form.contact_email.trim() || submitting} nextLabel={submitting ? 'Публикуем...' : 'Опубликовать'} isLoading={submitting} />
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }: any) {
  return <div className="bg-white rounded-2xl border border-gray-200 p-7"><h2 className="text-xl font-bold text-gray-900 mb-5">{title}</h2>{children}</div>
}
function Field({ label, children }: any) {
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
function Nav({ onBack, onNext, nextDisabled, nextLabel, isLoading, showBack = true }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      {showBack ? <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"><ChevronLeft className="w-4 h-4" /> Назад</button> : <div />}
      <button onClick={onNext} disabled={nextDisabled || isLoading} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${nextDisabled || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel} {!isLoading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function JobAddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <JobAddContent />
    </Suspense>
  )
}
