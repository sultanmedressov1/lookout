'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye, Loader2, AlertCircle, CheckCircle2,
  Building2, Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Шаг 1: поиск компании
  const [company, setCompany] = useState<{ id: string; name: string; bin: string } | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Шаг 2: данные аккаунта
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await createClient().rpc('search_companies', {
        p_query: q.trim(), p_limit: 6, p_offset: 0
      })
      setResults(data || [])
    } finally { setSearching(false) }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Создаём аккаунт с метаданными компании
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            type: 'business',
            company_id: company.id,
            company_name: company.name,
            company_bin: company.bin,
            contact_name: name,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message === 'User already registered'
          ? 'Этот email уже зарегистрирован. Войдите в аккаунт.'
          : signUpError.message)
        return
      }

      // Создаём/обновляем профиль компании
      if (data.user) {
        await supabase.from('company_profiles').upsert({
          company_id: company.id,
          user_id: data.user.id,
          is_verified: false,
          plan: 'free',
          can_respond_reviews: true,
        }, { onConflict: 'company_id' })
      }

      router.push('/business/dashboard')
      router.refresh()

    } catch (err) {
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Лого */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">Lookout</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-1">Регистрация для бизнеса</h1>
          <p className="text-sm text-gray-500">Размещайте вакансии и управляйте репутацией</p>
        </div>

        {/* Прогресс */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step > s ? 'bg-blue-600 text-white' :
                step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Шаг 1: Выбор компании */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Найдите вашу компанию</h2>
            <p className="text-xs text-gray-500 mb-5">Введите название или БИН компании</p>

            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={query}
                onChange={e => { setQuery(e.target.value); search(e.target.value) }}
                placeholder="Название или БИН..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
            </div>

            {results.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                {results.map(r => (
                  <button key={r.id}
                    onClick={() => { setCompany({ id: r.id, name: r.name_ru, bin: r.bin }); setQuery(r.name_ru); setResults([]) }}
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

            {company && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-5">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900 truncate">{company.name}</div>
                  <div className="text-xs text-blue-600">{company.bin}</div>
                </div>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!company}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                company ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
              Продолжить
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Компании нет в списке?{' '}
              <Link href="/search" className="text-blue-600">Найти через поиск</Link>
            </p>
          </div>
        )}

        {/* Шаг 2: Данные аккаунта */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-0.5">Создайте аккаунт</h2>
              <p className="text-xs text-gray-500">для {company?.name}</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ваше имя</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Айгерим Сейткали"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Рабочий email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="name@company.kz"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                minLength={8} placeholder="Минимум 8 символов"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Создать аккаунт
            </button>

            <button type="button" onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
              ← Назад
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
