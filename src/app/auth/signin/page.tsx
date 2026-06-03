'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Неверный email или пароль')
      setLoading(false)
      return
    }

    const user = data.user
    const isBusiness = user?.user_metadata?.type === 'business'

    // Проверяем статус модерации для бизнес-аккаунтов
    if (isBusiness) {
      const { data: request } = await supabase
        .from('business_requests')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (!request || request.status === 'pending') {
        // Аккаунт ещё не одобрен
        router.push('/auth/pending')
        return
      }

      if (request.status === 'rejected') {
        await supabase.auth.signOut()
        setError('Ваша заявка была отклонена. Свяжитесь с нами для уточнения.')
        setLoading(false)
        return
      }

      // Одобрен — на dashboard
      router.push('/business/dashboard')
      router.refresh()
      return
    }

    // Обычный пользователь
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">Lookout</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-1">Войти</h1>
          <p className="text-sm text-gray-500">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSignIn} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Войти
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Хотите разместить вакансии?{' '}
            <Link href="/auth/business" className="text-blue-600 hover:text-blue-800 font-medium">
              Регистрация для бизнеса
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
