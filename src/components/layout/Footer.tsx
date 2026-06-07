import Link from 'next/link'
import { Eye } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Бренд */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 text-lg">Lookout</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Честная информация о работодателях Казахстана. Реальные отзывы, зарплаты и вакансии.
            </p>
          </div>

          {/* Соискателям */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Соискателям</h4>
            <ul className="space-y-2">
              <li><Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Вакансии</Link></li>
              <li><Link href="/salaries" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Зарплаты</Link></li>
              <li><Link href="/search" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Компании</Link></li>
              <li><Link href="/reviews/add" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Написать отзыв</Link></li>
              <li><Link href="/jobs/saved" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Сохранённые вакансии</Link></li>
            </ul>
          </div>

          {/* Работодателям */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Работодателям</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/business" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Разместить вакансию</Link></li>
              <li><Link href="/auth/business" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Управление страницей</Link></li>
              <li><Link href="/business/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Панель управления</Link></li>
            </ul>
          </div>

          {/* Аккаунт */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Аккаунт</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/signup" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Регистрация</Link></li>
              <li><Link href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Войти</Link></li>
              <li><Link href="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Мой профиль</Link></li>
              <li><Link href="/notifications" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Уведомления</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© {year} Lookout. Все права защищены.</p>
          <p className="text-xs text-gray-400">Казахстан · lookout.kz</p>
        </div>
      </div>
    </footer>
  )
}
