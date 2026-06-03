'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Building2, Search, Loader2,
  ChevronRight, ChevronLeft, Briefcase
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = [
  'IT и разработка', 'Менеджмент', 'Продажи', 'Маркетинг',
  'Финансы', 'HR', 'Операции', 'Дизайн', 'Аналитика', 'Другое'
]

const CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз',
  'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау',
  'Костанай', 'Кызылорда', 'Уральск', 'Петропавловск', 'Актау'
]

function JobAddContent() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [jobId, setJobId] = useState('')
  const [company, setCompany] = useState<{ id: string; name: string; bin: string } | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    nice_to_have: '',
    category: '',
    employment_type: 'full-time',
    experience_level: 'any',
    salary_from: '',
    salary_to: '',
    salary_visible: true,
    city: '',
    is_remote: false,
    contact_email: '',
    contact_name: '',
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase.from('jobs').insert([{
        company_id: company!.id,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        nice_to_have: form.nice_to_have || null,
        category: form.category || null,
        employment_type: form.employment_type,
        experience_level: form.experience_level,
        salary_from: form.salary_from ? parseInt(form.salary_from.replace(/\D/g, '')) : null,
        salary_to: form.salary_to ? parseInt(form.salary_to.replace(/\D/g, '')) : null,
        salary_visible: form.salary_visible,
        city: form.city || null,
        is_remote: form.is_remote,
        contact_email: form.contact_email || null,
        contact_name: form.contact_name || null,
        is_active: true,
      }]).select('id').single()

      if (error) {
        alert(`Ошибка: ${error.message}`)
        return
      }

      setJobId(data.id)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Вакансия опубликована!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Ваша вакансия уже видна соискателям на Lookout.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/jobs/${jobId}`}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Посмотреть вакансию
            </Link>
            <Link href="/jobs"
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Все вакансии
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { n: 1, label: 'Компания' },
    { n: 2, label: 'Вакансия' },
    { n: 3, label: 'Условия' },
    { n: 4, label: 'Контакт' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Разместить вакансию</h1>
          <p className="text-gray-500 text-sm">Бесплатно. Рядом с отзывами о вашей компании.</p>
        </div>

        {/* Прогресс */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex flex-col items-center`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step > s.n ? 'bg-blue-600 text-white' : step === s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${step === s.n ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 mx-1 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Шаг 1: Компания */}
        {step === 1 && (
          <CompanyStep selected={company} onSelect={setCompany} onNext={() => setStep(2)} />
        )}

        {/* Шаг 2: Описание вакансии */}
        {step === 2 && (
          <Card title="О вакансии" subtitle="Опишите позицию подробно — это увеличивает отклики">
            <div className="space-y-4 mb-6">
              <Field label="Название вакансии *">
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Frontend Developer, Менеджер по продажам..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>

              <Field label="Категория">
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Описание *">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={5} placeholder="Чем будет заниматься сотрудник? Какие задачи предстоит решать?"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
              </Field>

              <Field label="Требования">
                <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
                  rows={4} placeholder="Опыт, навыки, образование..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
              </Field>

              <Field label="Будет плюсом">
                <textarea value={form.nice_to_have} onChange={e => set('nice_to_have', e.target.value)}
                  rows={2} placeholder="Дополнительные преимущества кандидата..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
              </Field>
            </div>
            <NavBtn onBack={() => setStep(1)} onNext={() => setStep(3)}
              nextDisabled={!form.title.trim() || !form.description.trim()} nextLabel="Далее" />
          </Card>
        )}

        {/* Шаг 3: Условия */}
        {step === 3 && (
          <Card title="Условия работы" subtitle="Прозрачность повышает количество откликов">
            <div className="space-y-4 mb-6">

              {/* Тип и уровень */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Тип занятости">
                  <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="full-time">Полная ставка</option>
                    <option value="part-time">Частичная</option>
                    <option value="contract">Контракт</option>
                    <option value="intern">Стажировка</option>
                    <option value="remote">Удалённо</option>
                  </select>
                </Field>
                <Field label="Уровень">
                  <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="any">Любой</option>
                    <option value="intern">Стажёр</option>
                    <option value="junior">Junior</option>
                    <option value="middle">Middle</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </Field>
              </div>

              {/* Зарплата */}
              <Field label="Зарплата (₸/мес)">
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.salary_from} onChange={e => set('salary_from', e.target.value)}
                    placeholder="от 300 000" className="text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                  <input value={form.salary_to} onChange={e => set('salary_to', e.target.value)}
                    placeholder="до 600 000" className="text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.salary_visible} onChange={e => set('salary_visible', e.target.checked)}
                    className="rounded" />
                  <span className="text-xs text-gray-500">Показывать зарплату в объявлении</span>
                </label>
              </Field>

              {/* Город */}
              <Field label="Город">
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_remote} onChange={e => set('is_remote', e.target.checked)}
                  className="rounded" />
                <span className="text-sm text-gray-700">Возможна удалённая работа</span>
              </label>
            </div>
            <NavBtn onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Далее" />
          </Card>
        )}

        {/* Шаг 4: Контакт */}
        {step === 4 && (
          <Card title="Контактная информация" subtitle="Как связаться с кандидатами">
            <div className="space-y-4 mb-6">
              <Field label="Email для откликов *">
                <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                  placeholder="hr@company.kz"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>
              <Field label="Имя контактного лица">
                <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                  placeholder="Айгерим, HR Manager"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                Вакансия будет активна 30 дней. Соискатели увидят её рядом с отзывами о вашей компании — это увеличивает доверие.
              </div>
            </div>
            <NavBtn onBack={() => setStep(3)} onNext={handleSubmit}
              nextDisabled={!form.contact_email.trim() || submitting}
              nextLabel={submitting ? 'Публикуем...' : 'Опубликовать вакансию'}
              isLoading={submitting} />
          </Card>
        )}
      </div>
    </div>
  )
}

function CompanyStep({ selected, onSelect, onNext }: any) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await createClient().rpc('search_companies', { p_query: q.trim(), p_limit: 6, p_offset: 0 })
      setResults(data || [])
    } finally { setLoading(false) }
  }, [])

  return (
    <Card title="Ваша компания" subtitle="Вакансия появится на странице компании">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }}
          placeholder="Название или БИН..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          {results.map(r => (
            <button key={r.id} onClick={() => { onSelect({ id: r.id, name: r.name_ru, bin: r.bin }); setQuery(r.name_ru); setResults([]) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{r.name_ru}</div>
                <div className="text-xs text-gray-400">{r.bin} · {r.city}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected?.name && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-900">{selected.name}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onNext} disabled={!selected?.id}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium ${
            selected?.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}>
          Продолжить <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}

function Card({ title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-7">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
      {children}
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function NavBtn({ onBack, onNext, nextDisabled, nextLabel, isLoading }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ChevronLeft className="w-4 h-4" /> Назад
      </button>
      <button onClick={onNext} disabled={nextDisabled || isLoading}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
          nextDisabled || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}>
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
