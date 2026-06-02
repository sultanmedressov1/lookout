'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Star, ChevronRight, ChevronLeft, CheckCircle2,
  ShieldCheck, Building2, Search, Loader2, Mail,
  FileText, Linkedin, Users, Handshake
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Типы ────────────────────────────────────────────────
type ReviewType = 'employee' | 'counterparty'
type Step = 1 | 2 | 3 | 4 | 5

interface EmployeeForm {
  rating_overall: number
  rating_salary: number
  rating_management: number
  rating_culture: number
  rating_growth: number
  title: string
  pros: string
  cons: string
  advice: string
  is_current: boolean
  year_start: string
  year_end: string
  position_category: string
}

interface CounterpartyForm {
  rating_overall: number
  rating_payment: number
  rating_communication: number
  rating_quality: number
  title: string
  content: string
  deal_year: string
  deal_type: string
}

const POSITION_CATEGORIES = ['IT и разработка', 'Менеджмент', 'Продажи', 'Маркетинг', 'Финансы', 'HR', 'Операции', 'Юридический', 'Производство', 'Другое']
const DEAL_TYPES = ['Товары', 'Услуги', 'Строительство', 'IT-услуги', 'Логистика', 'Консалтинг', 'Другое']
const YEARS = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i))

// ─── Главный компонент формы ──────────────────────────────
export default function AddReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [reviewType, setReviewType] = useState<ReviewType>(
    (searchParams.get('type') as ReviewType) || 'employee'
  )
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; bin: string } | null>(
    searchParams.get('company')
      ? { id: searchParams.get('company')!, name: '', bin: '' }
      : null
  )
  const [verifyMethod, setVerifyMethod] = useState<'email' | 'contract' | 'linkedin'>('email')
  const [verifyValue, setVerifyValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [empForm, setEmpForm] = useState<EmployeeForm>({
    rating_overall: 0, rating_salary: 0, rating_management: 0,
    rating_culture: 0, rating_growth: 0,
    title: '', pros: '', cons: '', advice: '',
    is_current: true, year_start: '', year_end: '', position_category: '',
  })

  const [cptyForm, setCptyForm] = useState<CounterpartyForm>({
    rating_overall: 0, rating_payment: 0, rating_communication: 0, rating_quality: 0,
    title: '', content: '', deal_year: '', deal_type: '',
  })

  const totalSteps = 4
  const progress = ((step - 1) / totalSteps) * 100

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const table = reviewType === 'employee' ? 'reviews_employee' : 'reviews_counterparty'

      const data = reviewType === 'employee'
        ? {
            company_id: selectedCompany?.id,
            rating_overall: empForm.rating_overall,
            rating_salary: empForm.rating_salary || null,
            rating_management: empForm.rating_management || null,
            rating_culture: empForm.rating_culture || null,
            rating_growth: empForm.rating_growth || null,
            title: empForm.title,
            pros: empForm.pros || null,
            cons: empForm.cons || null,
            advice_to_management: empForm.advice || null,
            is_current_employee: empForm.is_current,
            employment_year_start: empForm.year_start ? parseInt(empForm.year_start) : null,
            employment_year_end: empForm.year_end ? parseInt(empForm.year_end) : null,
            position_category: empForm.position_category || null,
            verification_type: verifyMethod,
            verification_status: 'pending',
            is_published: false,
          }
        : {
            company_id: selectedCompany?.id,
            rating_overall: cptyForm.rating_overall,
            rating_payment: cptyForm.rating_payment || null,
            rating_communication: cptyForm.rating_communication || null,
            rating_quality: cptyForm.rating_quality || null,
            title: cptyForm.title,
            content: cptyForm.content,
            deal_year: cptyForm.deal_year ? parseInt(cptyForm.deal_year) : null,
            deal_type: cptyForm.deal_type || null,
            verification_status: 'pending',
            is_published: false,
          }

      await supabase.from(table).insert([data])
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) return <SuccessScreen companyName={selectedCompany?.name || ''} type={reviewType} />

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Шаг {Math.min(step, totalSteps)} из {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Шаги */}
        {step === 1 && (
          <Step1
            reviewType={reviewType}
            onSelect={(type) => { setReviewType(type); setStep(2) }}
          />
        )}
        {step === 2 && (
          <Step2
            selectedCompany={selectedCompany}
            onSelect={(company) => setSelectedCompany(company)}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
            reviewType={reviewType}
            empForm={empForm}
            cptyForm={cptyForm}
            onEmpChange={(field, val) => setEmpForm(p => ({ ...p, [field]: val }))}
            onCptyChange={(field, val) => setCptyForm(p => ({ ...p, [field]: val }))}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4
            reviewType={reviewType}
            verifyMethod={verifyMethod}
            verifyValue={verifyValue}
            onMethodChange={setVerifyMethod}
            onValueChange={setVerifyValue}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Шаг 1: Тип отзыва ───────────────────────────────────
function Step1({ reviewType, onSelect }: { reviewType: ReviewType; onSelect: (t: ReviewType) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Оставить отзыв</h1>
      <p className="text-gray-500 mb-8">Ваш опыт помогает другим принимать взвешенные решения.</p>

      <div className="space-y-3">
        <TypeCard
          icon={Users}
          selected={reviewType === 'employee'}
          title="Отзыв сотрудника"
          desc="Расскажите о работе в компании — зарплата, культура, руководство"
          onClick={() => onSelect('employee')}
        />
        <TypeCard
          icon={Handshake}
          selected={reviewType === 'counterparty'}
          title="Отзыв контрагента"
          desc="Поделитесь опытом сотрудничества — оплата, коммуникация, качество"
          onClick={() => onSelect('counterparty')}
        />
      </div>
    </div>
  )
}

function TypeCard({ icon: Icon, selected, title, desc, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${selected ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
      <div>
        <div className={`font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>{title}</div>
        <div className="text-sm text-gray-500">{desc}</div>
      </div>
      {selected && <ChevronRight className="w-5 h-5 text-blue-500 ml-auto flex-shrink-0" />}
    </button>
  )
}

// ─── Шаг 2: Выбор компании ───────────────────────────────
function Step2({ selectedCompany, onSelect, onNext, onBack }: any) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_companies', { p_query: q.trim(), p_limit: 6, p_offset: 0 })
      setResults(data || [])
    } finally { setLoading(false) }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">О какой компании?</h2>
      <p className="text-gray-500 mb-6">Найдите компанию по названию или БИН</p>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value) }}
          placeholder="Название или БИН..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          {results.map(r => (
            <button key={r.id}
              onClick={() => { onSelect({ id: r.id, name: r.name_ru, bin: r.bin }); setQuery(r.name_ru); setResults([]) }}
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

      {selectedCompany?.name && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-medium text-emerald-800">{selectedCompany.name}</span>
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!selectedCompany?.id}
        nextLabel="Продолжить"
      />
    </div>
  )
}

// ─── Шаг 3: Контент отзыва ───────────────────────────────
function Step3({ reviewType, empForm, cptyForm, onEmpChange, onCptyChange, onNext, onBack }: any) {
  const isEmp = reviewType === 'employee'
  const ratings = isEmp
    ? [
        { key: 'rating_overall', label: 'Общая оценка', required: true },
        { key: 'rating_salary', label: 'Зарплата и льготы', required: false },
        { key: 'rating_management', label: 'Руководство', required: false },
        { key: 'rating_culture', label: 'Корпоративная культура', required: false },
        { key: 'rating_growth', label: 'Возможности роста', required: false },
      ]
    : [
        { key: 'rating_overall', label: 'Общая оценка', required: true },
        { key: 'rating_payment', label: 'Платёжная дисциплина', required: false },
        { key: 'rating_communication', label: 'Коммуникация', required: false },
        { key: 'rating_quality', label: 'Качество работ', required: false },
      ]

  const form = isEmp ? empForm : cptyForm
  const onChange = isEmp ? onEmpChange : onCptyChange

  const canProceed = form.rating_overall > 0 && form.title.trim().length > 0 &&
    (isEmp ? (form.pros.trim() || form.cons.trim()) : form.content.trim().length > 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Ваш опыт</h2>
      <p className="text-gray-500 mb-6">Будьте честны и конкретны — это поможет другим</p>

      {/* Рейтинги */}
      <div className="space-y-4 mb-6">
        {ratings.map(({ key, label, required }) => (
          <div key={key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              {required && <span className="text-red-500 text-xs">*</span>}
            </div>
            <StarPicker value={form[key]} onChange={v => onChange(key, v)} />
          </div>
        ))}
      </div>

      {/* Метаданные для сотрудника */}
      {isEmp && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Категория должности</label>
            <select value={empForm.position_category} onChange={e => onEmpChange('position_category', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Выберите...</option>
              {POSITION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Год начала работы</label>
            <select value={empForm.year_start} onChange={e => onEmpChange('year_start', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Год...</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Для контрагента */}
      {!isEmp && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Год сделки</label>
            <select value={cptyForm.deal_year} onChange={e => onCptyChange('deal_year', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Год...</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Тип сделки</label>
            <select value={cptyForm.deal_type} onChange={e => onCptyChange('deal_type', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Выберите...</option>
              {DEAL_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Текст */}
      <div className="space-y-4">
        <Field label="Заголовок отзыва *" required>
          <input value={form.title} onChange={e => onChange('title', e.target.value)}
            placeholder={isEmp ? 'Например: Хорошее место для роста, но есть нюансы' : 'Кратко опишите опыт'}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
        </Field>

        {isEmp ? (
          <>
            <Field label="Плюсы">
              <textarea value={empForm.pros} onChange={e => onEmpChange('pros', e.target.value)}
                rows={3} placeholder="Что вам нравилось в этой компании?"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
            </Field>
            <Field label="Минусы">
              <textarea value={empForm.cons} onChange={e => onEmpChange('cons', e.target.value)}
                rows={3} placeholder="Что можно было бы улучшить?"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
            </Field>
          </>
        ) : (
          <Field label="Подробный отзыв *" required>
            <textarea value={cptyForm.content} onChange={e => onCptyChange('content', e.target.value)}
              rows={5} placeholder="Опишите ваш опыт работы с этой компанией..."
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
          </Field>
        )}
      </div>

      <div className="mt-6">
        <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canProceed} nextLabel="Далее" />
      </div>
    </div>
  )
}

// ─── Шаг 4: Верификация ───────────────────────────────────
function Step4({ reviewType, verifyMethod, verifyValue, onMethodChange, onValueChange, isSubmitting, onSubmit, onBack }: any) {
  const isEmp = reviewType === 'employee'

  const methods = isEmp
    ? [
        { id: 'email', icon: Mail, label: 'Корпоративная почта', desc: 'Введите email @company.kz — отправим код подтверждения' },
        { id: 'contract', icon: FileText, label: 'Трудовой договор', desc: 'Загрузите фото договора (лицо и ИИН можно закрыть)' },
        { id: 'linkedin', icon: Linkedin, label: 'LinkedIn профиль', desc: 'Вставьте ссылку на профиль с историей работы' },
      ]
    : [
        { id: 'email', icon: Mail, label: 'Рабочая почта', desc: 'Подтвердите через корпоративный email' },
        { id: 'contract', icon: FileText, label: 'Счёт-фактура', desc: 'Введите номер счёта-фактуры или договора' },
      ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Подтвердите отзыв</h2>
      </div>
      <p className="text-gray-500 mb-6">
        Верификация защищает платформу от фейков. Ваши персональные данные не публикуются.
      </p>

      {/* Методы верификации */}
      <div className="space-y-2.5 mb-6">
        {methods.map(({ id, icon: Icon, label, desc }) => (
          <button key={id} onClick={() => onMethodChange(id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              verifyMethod === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${verifyMethod === id ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${verifyMethod === id ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className={`text-sm font-medium ${verifyMethod === id ? 'text-blue-900' : 'text-gray-800'}`}>{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Поле ввода верификации */}
      <div className="mb-6">
        <input value={verifyValue} onChange={e => onValueChange(e.target.value)}
          placeholder={
            verifyMethod === 'email' ? 'email@company.kz' :
            verifyMethod === 'linkedin' ? 'https://linkedin.com/in/...' :
            isEmp ? 'Номер договора или дата' : 'Номер счёта-фактуры'
          }
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Дисклеймер */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-xs text-gray-500 leading-relaxed">
        <strong className="text-gray-700">Анонимность гарантирована.</strong> Верификационные данные используются только для проверки и не публикуются. Отзыв выйдет под анонимным профилем.
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        nextDisabled={!verifyValue.trim() || isSubmitting}
        nextLabel={isSubmitting ? 'Отправляем...' : 'Отправить отзыв'}
        isLoading={isSubmitting}
      />
    </div>
  )
}

// ─── Успех ───────────────────────────────────────────────
function SuccessScreen({ companyName, type }: { companyName: string; type: ReviewType }) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Отзыв отправлен!</h2>
        <p className="text-gray-500 mb-6">
          Спасибо! Ваш отзыв отправлен на модерацию и появится на странице компании в течение 24 часов.
        </p>
        <a href={`/search`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
          Вернуться к поиску
        </a>
      </div>
    </div>
  )
}

// ─── Вспомогательные компоненты ───────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 transition-colors ${
            s <= (hovered || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 hover:text-amber-300'
          }`} />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-500 self-center">
          {['', 'Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][value]}
        </span>
      )}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel, isLoading }: any) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
        <ChevronLeft className="w-4 h-4" /> Назад
      </button>
      <button onClick={onNext} disabled={nextDisabled}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
          nextDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {nextLabel}
        {!isLoading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}
