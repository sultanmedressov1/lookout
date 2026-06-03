'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, Menu, X, ChevronDown } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">

          {/* Логотип */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Lookout</span>
          </Link>

          {/* Поиск — только не на главной */}
          <div className="flex-1 max-w-md hidden lg:block">
            <SearchBar size="default" />
          </div>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            <Link
              href="/search"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Компании
            </Link>
            <Link
              href="/salaries"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Зарплаты
            </Link>
            <Link
              href="/reviews/add"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Оставить отзыв
            </Link>
          </nav>

          {/* CTA кнопки */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/claim"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Для бизнеса
            </Link>
          </div>

          {/* Мобильное меню */}
          <button
            className="md:hidden ml-auto p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Мобильное меню */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <SearchBar size="default" />
            <div className="pt-2 space-y-1">
              {[
                ['Компании', '/search'],
                ['Работодатели', '/employers'],
                ['Оставить отзыв', '/reviews/add'],
                ['Для бизнеса', '/claim'],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
