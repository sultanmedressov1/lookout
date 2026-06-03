'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, AlertCircle, CheckCircle2, Building2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    company_name: '',
    company_bin: '',
    contact_name: '',
    email: '',
    password: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Валидация БИН
    if (form.company_bin.length !== 12 || !/^\d+$/.test(form.company_bin)) {
      setError('БИН должен содержать ровно 12 цифр')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Создаём аккаунт
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            type: 'business',
            company_name: form.company_name,
            company_bin: form.company_bin,
            contact_name: form.contact_name,
            status: 'pending', // На модерации
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Этот email уже зарегистрирован. Войдите в аккаунт.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      // Сохраняем заявку на модерацию
      if (data.user) {
        await supabase.from('business_requests').insert([{
          user_id: data.user.id,
          company_name: form.company_name,
          company_bin: form.company_bin,
          contact_name: form.contact_name,
          contact_email: form.email,
          status: 'pending',
        }])
      }

      setStep(2)
    } catch (err) {
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  // Шаг 2 — успех / ожидание модерации
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Заявка отправлена!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Мы проверим данные вашей компании в течение <strong>1-2 рабочих дней</strong>.
            После проверки вы получите письмо на <strong>{form.email}</strong> с дальнейшими инструкциями.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600">Заявка зарегистрирована</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-gray-600">Ожидает проверки модератором</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              <span>Активация аккаунта после одобрения</span>
            </div>
          </div>

          <Link href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
            Вернуться на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">Lookout</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-1">Регистрация бизнеса</h1>
          <p className="text-sm text-gray-500">Размещайте вакансии и управляйте репутацией</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Данные компании */}
          <div className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              <Building2 className="w-3.5 h-3.5" /> О компании
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  БИН компании
                </label>
                <input
                  value={form.company_bin}
                  onChange={e => set('company_bin', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="123456789012"
                  maxLength={12}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-mono tracking-wider"
                />
                <p className="text-xs text-gray-400 mt-1">12 цифр · найдёте на egov.kz</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Название компании
                </label>
                <input
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                  placeholder="ТОО Название Компании"
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Данные контакта */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Контактное лицо
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ваше имя</label>
              <input
                value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="Айгерим Сейткали"
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="name@company.kz"
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Пароль</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Минимум 8 символов"
                minLength={8}
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Что будет после */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
            После регистрации мы проверим данные компании и свяжемся с вами в течение 1–2 дней.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Отправить заявку
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
