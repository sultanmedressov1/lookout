import Link from 'next/link'
import { Clock, CheckCircle2, Eye } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center">

        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900">Lookout</span>
        </Link>

        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Аккаунт на проверке</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Ваша заявка получена и находится на рассмотрении. Обычно это занимает <strong>1–2 рабочих дня</strong>.
          Мы свяжемся с вами по email когда аккаунт будет активирован.
        </p>

        {/* Статус шагов */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">Заявка отправлена</div>
              <div className="text-xs text-gray-400">Данные компании получены</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Проверка модератором</div>
              <div className="text-xs text-gray-400">Идёт проверка данных</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-400">Активация аккаунта</div>
              <div className="text-xs text-gray-300">После одобрения</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            На главную
          </Link>
          <a href="mailto:support@lookout.kz"
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
            Написать нам
          </a>
        </div>
      </div>
    </div>
  )
}
