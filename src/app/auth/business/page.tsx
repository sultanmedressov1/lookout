'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ company_name: '', company_bin: '', contact_name: '', email: '', password: '' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) { setError('Введите название компании'); return }
    if (form.company_bin.length !== 12) { setError('БИН должен содержать 12 цифр'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Создаём компанию (short_id генерируется автоматически)
      const { data: company, error: coErr } = await supabase
        .from('companies')
        .insert({ name_ru: form.company_name.trim(), status: 'active' })
        .select('id, short_id')
        .single()

      if (coErr) {
        setError('Ошибка создания компании: ' + coErr.message)
        return
      }

      // Создаём аккаунт
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            type: 'business',
            company_id: company.id,
            company_short_id: company.short_id,
            company_name: form.company_name.trim(),
            contact_name: form.contact_name,
          }
        }
      })

      if (signUpError) {
        // Откат: удаляем компанию
        await supabase.from('companies').delete().eq('id', company.id)
        setError(signUpError.message.includes('already registered') ? 'Этот email уже зарегистрирован' : signUpError.message)
        return
      }

      // Заявка на модерацию
      if (data.user) {
        await supabase.from('business_requests').insert([{
          user_id: data.user.id,
          company_name: form.company_name.trim(),
          company_bin: form.company_bin,
          contact_name: form.contact_name,
          contact_email: form.email,
          status: 'pending',
        }])

        await supabase.from('company_profiles').upsert({
          company_id: company.id,
          user_id: data.user.id,
          is_verified: false,
          plan: 'free',
        }, { onConflict: 'company_id' })
      }

      router.push('/auth/pending')
    } catch {
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">Lookout</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-1">Регистрация для бизнеса</h1>
          <p className="text-sm text-gray-500">Управляйте репутацией и размещайте вакансии</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="pb-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5" /> Компания
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Название *</label>
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                placeholder="ТОО Название" required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">БИН *</label>
              <input value={form.company_bin} onChange={e => set('company_bin', e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="123456789012" maxLength={12} required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-mono tracking-wider" />
              <p className="text-xs text-gray-400 mt-1">12 цифр · нужен модератору для проверки</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ваше имя</label>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                placeholder="Айгерим Сейткали"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="name@company.kz" required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Пароль *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Минимум 8 символов" minLength={8} required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
            После регистрации мы проверим данные и активируем аккаунт в течение 1–2 дней.
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Отправить заявку
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
