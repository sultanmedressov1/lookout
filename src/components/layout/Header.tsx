'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Eye, Menu, X } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isBusiness = user?.user_metadata?.type === 'business'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">

          {/* Логотип */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Lookout</span>
          </Link>

          {/* Поиск */}
          <div className="flex-1 max-w-md hidden lg:block">
            <SearchBar size="default" />
          </div>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            <Link href="/jobs" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Вакансии</Link>
            <Link href="/salaries" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Зарплаты</Link>
            <Link href="/reviews/add" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Отзыв</Link>
          </nav>

          {/* Авторизация */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {isBusiness && (
                  <Link href="/business/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    {user.user_metadata?.company_name?.split(' ')[0] || 'Панель'}
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Войти
                </Link>
                <Link href="/auth/business"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Для бизнеса
                </Link>
              </>
            )}
          </div>

          {/* Мобильное меню */}
          <button className="md:hidden ml-auto p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Мобильное меню открытое */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <SearchBar size="default" />
            <div className="pt-2 space-y-1">
              {[['Вакансии','/jobs'],['Зарплаты','/salaries'],['Оставить отзыв','/reviews/add']].map(([label, href]) => (
                <Link key={href} href={href} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>{label}</Link>
              ))}
              {user ? (
                <>
                  {isBusiness && <Link href="/business/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Панель управления</Link>}
                  <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">Выйти</button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Войти</Link>
                  <Link href="/auth/business" className="block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setMenuOpen(false)}>Для бизнеса</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
