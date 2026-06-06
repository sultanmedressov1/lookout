'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  Building2, Search, Loader2, DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = [
  'IT и разработка', 'Менеджмент', 'Продажи', 'Маркетинг',
  'Финансы', 'HR', 'Операции', 'Юридический',
  'Производство', 'Дизайн', 'Аналитика', 'Другое'
]

const LEVELS = [
  { v: 'intern',    l: 'Стажёр' },
  { v: 'junior',   l: 'Junior' },
  { v: 'middle',   l: 'Middle' },
  { v: 'senior',   l: 'Senior' },
  { v: 'lead',     l: 'Lead' },
  { v: 'manager',  l: 'Менеджер' },
  { v: 'director', l: 'Директор' },
]

const CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз',
  'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау',
  'Костанай', 'Кызылорда', 'Уральск', 'Петропавловск', 'Актау'
]

const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

function formatSalary(val: string): string {
  const num = parseInt(val.replace(/\D/g, ''))
  if (!num) return ''
  return num.toLocaleString('ru-RU')
}

function SalaryAddContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [company, setCompany] = useState<{ id: string; name: string; bin: string } | null>(null)
  const [form, setForm] = useState({
    position_title: '',
    position_category: '',
    experience_level: '',
    employment_type: 'full-time',
    salary_monthly: '',
    salary_net: '',
    bonus_annual: '',
    city: '',
    year: String(new Date().getFullYear()),
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const monthly = parseInt(form.salary_monthly.replace(/\D/g, ''))
      if (!monthly || !company?.id) return

      await supabase.from('salaries').insert([{
        company_id: company.id,
        position_title: form.position_title,
        position_category: form.position_category || null,
        experience_level: form.experience_level || null,
        employment_type: form.employment_type,
        salary_monthly: monthly,
        salary_net: form.salary_net ? parseInt(form.salary_net.replace(/\D/g, '')) : null,
        bonus_annual: form.bonus_annual ? parseInt(form.bonus_annual.replace(/\D/g, '')) : null,
        city: form.city || null,
        year: parseInt(form.year),
        is_published: true,
      }])
      setSubmitted(true)
    } catch (err) { console.error(err) }
    finally { setIsSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Зарплата добавлена!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Спасибо! Ваши данные помогут другим узнать реальный рыночный уровень зарплат.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setSubmitted(false); setStep(1); setForm({ position_title:'',position_category:'',experience_level:'',employment_type:'full-time',salary_monthly:'',salary_net:'',bonus_annual:'',city:'',year:String(new Date().getFullYear()) }) }}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
              Добавить ещё
            </button>
            {company && (
              <Link href={`/company/${company.short_id}`}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                К компании
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Добавить зарплату</h1>
          <p className="text-gray-500 text-sm">Анонимно. Помогает другим знать рыночный уровень.</p>
        </div>

        {/* Прогресс */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step > s ? 'bg-blue-600 text-white' : step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Шаг 1: Компания */}
        {step === 1 && (
          <CompanyStep selected={company} onSelect={setCompany} onNext={() => setStep(2)} />
        )}

        {/* Шаг 2: Должность */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Ваша должность</h2>
            <p className="text-gray-500 text-sm mb-6">Не показывается публично — только категория</p>

            <div className="space-y-4 mb-6">
              <Field label="Название должности *">
                <input value={form.position_title} onChange={e => set('position_title', e.target.value)}
                  placeholder="Например: Frontend Developer, Менеджер по продажам"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>

              <Field label="Направление">
                <select value={form.position_category} onChange={e => set('position_category', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Выберите...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Уровень">
                <div className="grid grid-cols-4 gap-2">
                  {LEVELS.map(l => (
                    <button key={l.v} onClick={() => set('experience_level', l.v)}
                      className={`py-2 rounded-lg text-xs font-medium border-2 transition-colors ${
                        form.experience_level === l.v
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {l.l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Тип занятости">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'full-time', l: 'Полная ставка' },
                    { v: 'part-time', l: 'Частичная' },
                    { v: 'contract', l: 'Контракт' },
                    { v: 'intern', l: 'Стажировка' },
                  ].map(t => (
                    <button key={t.v} onClick={() => set('employment_type', t.v)}
                      className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        form.employment_type === t.v
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <NavBtn onBack={() => setStep(1)} onNext={() => setStep(3)}
              nextDisabled={!form.position_title.trim()} nextLabel="Далее" />
          </div>
        )}

        {/* Шаг 3: Компенсация */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Компенсация</h2>
            <p className="text-gray-500 text-sm mb-6">Все суммы в тенге (₸), в месяц</p>

            <div className="space-y-4 mb-6">
              <Field label="Зарплата брутто (до налогов) *">
                <div className="relative">
                  <input
                    value={form.salary_monthly}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      set('salary_monthly', raw ? parseInt(raw).toLocaleString('ru-RU') : '')
                    }}
                    placeholder="450 000"
                    className="w-full text-sm border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-400" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₸/мес</span>
                </div>
              </Field>

              <Field label="Зарплата нетто (на руки) — необязательно">
                <div className="relative">
                  <input
                    value={form.salary_net}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      set('salary_net', raw ? parseInt(raw).toLocaleString('ru-RU') : '')
                    }}
                    placeholder="380 000"
                    className="w-full text-sm border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-400" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₸/мес</span>
                </div>
              </Field>

              <Field label="Годовой бонус — необязательно">
                <div className="relative">
                  <input
                    value={form.bonus_annual}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      set('bonus_annual', raw ? parseInt(raw).toLocaleString('ru-RU') : '')
                    }}
                    placeholder="1 000 000"
                    className="w-full text-sm border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-400" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₸/год</span>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Город">
                  <select value={form.city} onChange={e => set('city', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    <option value="">Выберите...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Год">
                  <select value={form.year} onChange={e => set('year', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs text-gray-500">
              Данные анонимны. Мы никогда не публикуем имена или точные должности.
            </div>

            <NavBtn onBack={() => setStep(2)} onNext={handleSubmit}
              nextDisabled={!form.salary_monthly.trim() || isSubmitting}
              nextLabel={isSubmitting ? 'Сохраняем...' : 'Опубликовать'}
              isLoading={isSubmitting} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Шаг выбора компании ─────────────────────────────────
function CompanyStep({ selected, onSelect, onNext }: any) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await createClient().from('companies')
        .select('id, short_id, name_ru, city')
        .ilike('name_ru', `%${q.trim()}%`).limit(6)
      setResults(data || [])
    } finally { setLoading(false) }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-7">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Где вы работаете?</h2>
      <p className="text-gray-500 text-sm mb-6">Найдите компанию по названию или БИН</p>

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
            <button key={r.id} onClick={() => { onSelect({ id: r.id, short_id: r.short_id, name: r.name_ru }); setQuery(r.name_ru); setResults([]) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{r.name_ru}</div>
                <div className="text-xs text-gray-400">{r.city}</div>
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
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            selected?.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}>
          Продолжить <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Вспомогательные компоненты ───────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export default function SalaryAddPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    }>
      <SalaryAddContent />
    </Suspense>
  )
}
