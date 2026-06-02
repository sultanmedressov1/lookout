'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

interface Props {
  bin: string
}

export function CompanyFetcher({ bin }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('Запрашиваем данные у КГД...')

  useEffect(() => {
    const messages = [
      'Запрашиваем данные у КГД...',
      'Проверяем регистрационные данные...',
      'Почти готово...',
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setMessage(messages[i])
    }, 2000)

    // Вызываем API
    fetch(`/api/company/${bin}`)
      .then(r => r.json())
      .then(data => {
        clearInterval(interval)
        if (data.company) {
          // Данные получены — обновляем страницу
          router.refresh()
        } else {
          setStatus('error')
        }
      })
      .catch(() => {
        clearInterval(interval)
        setStatus('error')
      })

    return () => clearInterval(interval)
  }, [bin, router])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Компания не найдена</h2>
          <p className="text-sm text-gray-500 mb-6">
            БИН <span className="font-mono font-medium">{bin}</span> не найден в реестре КГД.
            Проверьте правильность введённого номера.
          </p>
          <a href="/search"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Вернуться к поиску
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Загружаем данные
        </h2>
        <p className="text-sm text-gray-500 mb-2">{message}</p>
        <p className="text-xs text-gray-400">
          Первый запрос занимает 5–10 секунд. Последующие — мгновенно из кэша.
        </p>
        <div className="mt-6 text-xs text-gray-300 font-mono">{bin}</div>
      </div>
    </div>
  )
}
