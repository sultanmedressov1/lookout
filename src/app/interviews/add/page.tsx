'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, CheckCircle2, Building2,
  Search, Loader2, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = ['IT и разработка','Менеджмент','Продажи','Маркетинг','Финансы','HR','Операции','Дизайн','Аналитика','Другое']

function InterviewContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [company, setCompany] = useState<{id:string;name:string;bin:string}|null>(null)

  const [form, setForm] = useState({
    rating_overall: 0,
    experience: '' as ''|'positive'|'neutral'|'negative',
    difficulty: '' as ''|'easy'|'average'|'difficult',
    offer_received: '' as ''|'yes'|'no'|'declined',
    title: '',
    description: '',
    questions: '',
    position_title: '',
    position_category: '',
    duration_weeks: '',
    year: String(new Date().getFullYear()),
  })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reviews_interview').insert([{
        company_id: company!.id,
        rating_overall: form.rating_overall,
        experience: form.experience || null,
        difficulty: form.difficulty || null,
        offer_received: form.offer_received || null,
        title: form.title,
        description: form.description || null,
        questions: form.questions || null,
        position_title: form.position_title || null,
        position_category: form.position_category || null,
        duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null,
        year: parseInt(form.year),
        is_published: true,
      }])
      if (error) { alert(`Ошибка: ${error.message}`); return }
      setSubmitted(true)
    } catch(e) { alert('Что-то пошло не так') }
    finally { setSubmitting(false) }
  }

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Отзыв об интервью опубликован!</h2>
        <p className="text-gray-500 text-sm mb-6">Поможет другим кандидатам подготовиться.</p>
        <div className="flex gap-3 justify-center">
          {company && <Link href={`/company/${company.short_id}`} className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">К компании</Link>}
          <button onClick={() => { setSubmitted(false); setStep(1); setCompany(null) }} className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Ещё отзыв</button>
        </div>
      </div>
    </div>
  )

  const steps = [{n:1,l:'Компания'},{n:2,l:'Процесс'},{n:3,l:'Детали'}]

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Отзыв об интервью</h1>
          <p className="text-gray-500 text-sm">Помогите другим кандидатам подготовиться</p>
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
              {i < steps.length-1 && <div className={`h-0.5 w-10 mx-1 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Шаг 1: Компания */}
        {step === 1 && <CompanyStep selected={company} onSelect={setCompany} onNext={() => setStep(2)} />}

        {/* Шаг 2: Процесс интервью */}
        {step === 2 && (
          <Card title="Как прошло интервью?">
            <div className="space-y-5 mb-6">

              {/* Общая оценка */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Общее впечатление *</label>
                <div className="flex gap-2">
                  {[
                    {v:'positive', l:'Позитивное', icon:ThumbsUp, color:'emerald'},
                    {v:'neutral', l:'Нейтральное', icon:Minus, color:'gray'},
                    {v:'negative', l:'Негативное', icon:ThumbsDown, color:'red'},
                  ].map(opt => {
                    const colors: any = {
                      emerald: form.experience===opt.v ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:border-gray-300',
                      gray: form.experience===opt.v ? 'border-gray-500 bg-gray-100 text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300',
                      red: form.experience===opt.v ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    }
                    return (
                      <button key={opt.v} onClick={() => set('experience', opt.v)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-colors ${colors[opt.color]}`}>
                        <opt.icon className="w-4 h-4" />{opt.l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Сложность */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Сложность интервью</label>
                <div className="flex gap-2">
                  {[{v:'easy',l:'Лёгкое'},{v:'average',l:'Среднее'},{v:'difficult',l:'Сложное'}].map(opt => (
                    <button key={opt.v} onClick={() => set('difficulty', opt.v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${form.difficulty===opt.v ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Оффер */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Получили оффер?</label>
                <div className="flex gap-2">
                  {[{v:'yes',l:'Да'},{v:'no',l:'Нет'},{v:'declined',l:'Отказался'}].map(opt => (
                    <button key={opt.v} onClick={() => set('offer_received', opt.v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${form.offer_received===opt.v ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Звёзды */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Рейтинг процесса *</label>
                <StarRow value={form.rating_overall} onChange={v => set('rating_overall', v)} />
              </div>
            </div>
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!form.experience || form.rating_overall===0} nextLabel="Далее" />
          </Card>
        )}

        {/* Шаг 3: Детали */}
        {step === 3 && (
          <Card title="Расскажите подробнее">
            <div className="space-y-4 mb-6">
              <Field label="Заголовок *">
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Например: Три этапа, честный фидбэк"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="На какую позицию?">
                  <input value={form.position_title} onChange={e => set('position_title', e.target.value)}
                    placeholder="Frontend Developer"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                </Field>
                <Field label="Сколько шло (нед.)?">
                  <input type="number" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)}
                    placeholder="2"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400" />
                </Field>
              </div>

              <Field label="Описание процесса">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Как проходило интервью? Этапы, атмосфера..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
              </Field>

              <Field label="Вопросы которые задавали">
                <textarea value={form.questions} onChange={e => set('questions', e.target.value)}
                  rows={3} placeholder="Какие вопросы задавали? Это очень помогает другим кандидатам..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
              </Field>
            </div>
            <Nav onBack={() => setStep(2)} onNext={handleSubmit}
              nextDisabled={!form.title.trim() || submitting}
              nextLabel={submitting ? 'Публикуем...' : 'Опубликовать'}
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
      const { data } = await createClient().from('companies')
        .select('id, short_id, name_ru, city')
        .ilike('name_ru', `%${q.trim()}%`).limit(6)
      setResults(data || [])
    } finally { setLoading(false) }
  }, [])

  return (
    <Card title="О какой компании?" subtitle="Где вы проходили интервью">
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
            <button key={r.id} onClick={() => { onSelect({id:r.id,short_id:r.short_id,name:r.name_ru}); setQuery(r.name_ru); setResults([]) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{r.name_ru}</div>
                <div className="text-xs text-gray-400">{r.city}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {selected?.name && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-5">
          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-900">{selected.name}</span>
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={onNext} disabled={!selected?.id}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium ${selected?.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
          Продолжить <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(s)}>
          <svg className={`w-8 h-8 transition-colors ${s <= (hovered||value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{['','Очень плохо','Плохо','Нормально','Хорошо','Отлично'][value]}</span>}
    </div>
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
  return <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>{children}</div>
}
function Nav({ onBack, onNext, nextDisabled, nextLabel, isLoading }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ChevronLeft className="w-4 h-4" /> Назад
      </button>
      <button onClick={onNext} disabled={nextDisabled||isLoading}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium ${nextDisabled||isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel} {!isLoading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function InterviewAddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <InterviewContent />
    </Suspense>
  )
}
