'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Star, ChevronRight, ChevronLeft, CheckCircle2,
  Building2, Search, Loader2, ThumbsUp, ThumbsDown,
  Minus, TrendingUp, TrendingDown, Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4 | 5

const CATEGORIES = ['IT и разработка','Менеджмент','Продажи','Маркетинг','Финансы','HR','Операции','Юридический','Производство','Дизайн','Аналитика','Другое']
const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))

const RATINGS = [
  { key: 'rating_overall',      label: 'Общая оценка',           required: true },
  { key: 'rating_worklife',     label: 'Баланс работы и жизни',  required: false },
  { key: 'rating_culture',      label: 'Культура компании',      required: false },
  { key: 'rating_management',   label: 'Руководство',            required: false },
  { key: 'rating_compensation', label: 'Зарплата и льготы',      required: false },
  { key: 'rating_career',       label: 'Карьерный рост',         required: false },
]

function AddReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [company, setCompany] = useState<{ id: string; name: string; bin: string } | null>(null)
  const [form, setForm] = useState({
    rating_overall: 0, rating_worklife: 0, rating_culture: 0,
    rating_management: 0, rating_compensation: 0, rating_career: 0,
    title: '', pros: '', cons: '', advice: '',
    is_current_employee: true, position_category: '',
    year_start: '', year_end: '',
    recommend: null as boolean | null,
    ceo_approval: '' as '' | 'positive' | 'neutral' | 'negative',
    business_outlook: '' as '' | 'positive' | 'neutral' | 'negative',
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      await supabase.from('reviews_employee').insert([{
        company_id: company?.id,
        rating_overall: form.rating_overall,
        rating_worklife: form.rating_worklife || null,
        rating_culture: form.rating_culture || null,
        rating_management: form.rating_management || null,
        rating_compensation: form.rating_compensation || null,
        rating_career: form.rating_career || null,
        title: form.title,
        pros: form.pros || null,
        cons: form.cons || null,
        advice_to_management: form.advice || null,
        is_current_employee: form.is_current_employee,
        position_category: form.position_category || null,
        employment_year_start: form.year_start ? parseInt(form.year_start) : null,
        employment_year_end: form.year_end ? parseInt(form.year_end) : null,
        recommend: form.recommend,
        ceo_approval: form.ceo_approval || null,
        business_outlook: form.business_outlook || null,
        is_published: true,
        verification_status: 'unverified',
      }])
      setSubmitted(true)
    } catch (err) { console.error(err) }
    finally { setIsSubmitting(false) }
  }

  if (submitted) return <SuccessScreen name={company?.name || ''} />

  const steps = [
    { n: 1, label: 'Компания' },
    { n: 2, label: 'О работе' },
    { n: 3, label: 'Оценки' },
    { n: 4, label: 'Отзыв' },
    { n: 5, label: 'Финал' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Прогресс */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className={`flex flex-col items-center`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step > s.n ? 'bg-blue-600 text-white' :
                  step === s.n ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${step === s.n ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Шаг 1: Компания */}
        {step === 1 && (
          <CompanyStep selected={company} onSelect={setCompany} onNext={() => setStep(2)} />
        )}

        {/* Шаг 2: О работе */}
        {step === 2 && (
          <WorkStep form={form} set={set} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}

        {/* Шаг 3: Оценки */}
        {step === 3 && (
          <RatingsStep form={form} set={set} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}

        {/* Шаг 4: Текст отзыва */}
        {step === 4 && (
          <ReviewStep form={form} set={set} onNext={() => setStep(5)} onBack={() => setStep(3)} />
        )}

        {/* Шаг 5: Финальные вопросы */}
        {step === 5 && (
          <FinalStep
            form={form} set={set}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit} onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Шаг 1: Выбор компании ───────────────────────────────
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
    <Card title="О какой компании хотите написать?" subtitle="Найдите компанию по названию или БИН">
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
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
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

      <NavBtn onNext={onNext} nextDisabled={!selected?.id} nextLabel="Продолжить" showBack={false} />
    </Card>
  )
}

// ─── Шаг 2: О работе ─────────────────────────────────────
function WorkStep({ form, set, onNext, onBack }: any) {
  return (
    <Card title="Расскажите о своей работе" subtitle="Эта информация остаётся анонимной">
      <div className="space-y-4 mb-6">
        {/* Статус */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Вы сейчас работаете в этой компании?</label>
          <div className="flex gap-3">
            {[{ v: true, l: 'Работаю сейчас' }, { v: false, l: 'Бывший сотрудник' }].map(opt => (
              <button key={String(opt.v)} onClick={() => set('is_current_employee', opt.v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  form.is_current_employee === opt.v
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Категория */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Направление работы</label>
          <select value={form.position_category} onChange={e => set('position_category', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
            <option value="">Выберите...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Годы */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Год начала</label>
            <select value={form.year_start} onChange={e => set('year_start', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Год...</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {!form.is_current_employee && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Год окончания</label>
              <select value={form.year_end} onChange={e => set('year_end', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Год...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      <NavBtn onBack={onBack} onNext={onNext} nextLabel="Далее" />
    </Card>
  )
}

// ─── Шаг 3: Оценки ───────────────────────────────────────
function RatingsStep({ form, set, onNext, onBack }: any) {
  const canProceed = form.rating_overall > 0
  return (
    <Card title="Оцените компанию" subtitle="Звёздочки помогают другим быстро понять ситуацию">
      <div className="space-y-5 mb-6">
        {RATINGS.map(({ key, label, required }) => (
          <div key={key} className={`${required ? '' : 'opacity-90'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${required ? 'text-gray-900' : 'text-gray-600'}`}>
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              {form[key] > 0 && (
                <span className="text-xs text-gray-400">
                  {['','Очень плохо','Плохо','Нормально','Хорошо','Отлично'][form[key]]}
                </span>
              )}
            </div>
            <StarPicker value={form[key]} onChange={v => set(key, v)} />
          </div>
        ))}
      </div>
      <NavBtn onBack={onBack} onNext={onNext} nextDisabled={!canProceed} nextLabel="Далее" />
    </Card>
  )
}

// ─── Шаг 4: Текст отзыва ─────────────────────────────────
function ReviewStep({ form, set, onNext, onBack }: any) {
  const canProceed = form.title.trim().length >= 5 && (form.pros.trim() || form.cons.trim())
  return (
    <Card title="Напишите отзыв" subtitle="Будьте конкретны — это помогает другим кандидатам">
      <div className="space-y-4 mb-6">
        <Field label="Заголовок" required>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Например: Хорошая компания, но высокий темп работы"
            maxLength={100}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
        </Field>

        <Field label="Плюсы">
          <textarea value={form.pros} onChange={e => set('pros', e.target.value)} rows={3}
            placeholder="Что вам нравится? Команда, проекты, офис, бенефиты..."
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
        </Field>

        <Field label="Минусы">
          <textarea value={form.cons} onChange={e => set('cons', e.target.value)} rows={3}
            placeholder="Что можно улучшить? Процессы, коммуникация, зарплата..."
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
        </Field>

        <Field label="Совет руководству">
          <textarea value={form.advice} onChange={e => set('advice', e.target.value)} rows={2}
            placeholder="Что бы вы посоветовали руководству?"
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
        </Field>
      </div>
      <NavBtn onBack={onBack} onNext={onNext} nextDisabled={!canProceed} nextLabel="Далее" />
    </Card>
  )
}

// ─── Шаг 5: Финальные вопросы ─────────────────────────────
function FinalStep({ form, set, isSubmitting, onSubmit, onBack }: any) {
  return (
    <Card title="Последние вопросы" subtitle="Как у Glassdoor — ещё три быстрых вопроса">
      <div className="space-y-6 mb-6">

        {/* Рекомендуете? */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-3 block">
            Вы бы порекомендовали эту компанию другу?
          </label>
          <div className="flex gap-3">
            <TwoBtn icon={ThumbsUp} label="Да" active={form.recommend === true} onClick={() => set('recommend', true)} color="emerald" />
            <TwoBtn icon={ThumbsDown} label="Нет" active={form.recommend === false} onClick={() => set('recommend', false)} color="red" />
          </div>
        </div>

        {/* Одобряете CEO? */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-3 block">
            Как вы оцениваете руководство компании?
          </label>
          <div className="flex gap-2">
            {[
              { v: 'positive', l: 'Позитивно', icon: ThumbsUp },
              { v: 'neutral', l: 'Нейтрально', icon: Minus },
              { v: 'negative', l: 'Негативно', icon: ThumbsDown },
            ].map(opt => (
              <button key={opt.v} onClick={() => set('ceo_approval', opt.v)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                  form.ceo_approval === opt.v
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <opt.icon className="w-4 h-4" />
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Перспективы */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-3 block">
            Перспективы развития компании?
          </label>
          <div className="flex gap-2">
            {[
              { v: 'positive', l: 'Растёт', icon: TrendingUp },
              { v: 'neutral', l: 'Стабильно', icon: Minus },
              { v: 'negative', l: 'Снижается', icon: TrendingDown },
            ].map(opt => (
              <button key={opt.v} onClick={() => set('business_outlook', opt.v)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                  form.business_outlook === opt.v
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <opt.icon className="w-4 h-4" />
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
          Ваш отзыв анонимен. Мы не собираем ваши личные данные. Нажимая «Опубликовать», вы соглашаетесь с правилами платформы.
        </div>
      </div>

      <NavBtn onBack={onBack} onNext={onSubmit} nextLabel={isSubmitting ? 'Публикуем...' : 'Опубликовать отзыв'} isLoading={isSubmitting} />
    </Card>
  )
}

// ─── Успех ───────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Отзыв опубликован!</h2>
        <p className="text-gray-500 text-sm mb-6">Спасибо! Ваш опыт поможет другим принять взвешенное решение о карьере.</p>
        <div className="flex gap-3 justify-center">
          <a href="/reviews/add" className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg">
            Ещё отзыв
          </a>
          <a href="/search" className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            К поиску
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Вспомогательные компоненты ───────────────────────────
function Card({ title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-7">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
      {children}
    </div>
  )
}

function Field({ label, required, children }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s === value ? 0 : s)}>
          <Star className={`w-8 h-8 transition-colors ${s <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  )
}

function TwoBtn({ icon: Icon, label, active, onClick, color }: any) {
  const colors: any = {
    emerald: active ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:border-gray-300',
    red: active ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 text-gray-500 hover:border-gray-300',
  }
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${colors[color]}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  )
}

function NavBtn({ onBack, onNext, nextDisabled, nextLabel, isLoading, showBack = true }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      {showBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>
      ) : <div />}
      <button onClick={onNext} disabled={nextDisabled || isLoading}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
          nextDisabled || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel}
        {!isLoading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function AddReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    }>
      <AddReviewContent />
    </Suspense>
  )
}
