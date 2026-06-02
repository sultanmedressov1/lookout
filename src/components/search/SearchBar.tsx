'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRiskColor, getRiskLabel } from '@/lib/utils'
import type { SearchResult } from '@/types'

interface SearchBarProps {
  size?: 'default' | 'lg'
  defaultValue?: string
  theme?: 'light' | 'dark'
}

export function SearchBar({ size = 'default', defaultValue = '', theme = 'light' }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setIsOpen(false); return }
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_companies', { p_query: q.trim(), p_limit: 6, p_offset: 0 })
      setResults(data || [])
      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInput = (value: string) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setIsOpen(false) }
  }

  const isLg = size === 'lg'
  const isDark = theme === 'dark'

  const inputBg = isDark
    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus-within:bg-white/15 focus-within:border-white/40'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus-within:border-blue-500 focus-within:shadow-sm'

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center border-2 rounded-xl transition-all ${isLg ? 'h-14' : 'h-11'} ${inputBg}`}>
          {isLoading
            ? <Loader2 className={`absolute left-4 animate-spin ${isDark ? 'text-white/60' : 'text-gray-400'} ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`} />
            : <Search className={`absolute left-4 ${isDark ? 'text-white/60' : 'text-gray-400'} ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`} />
          }
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Название компании или БИН..."
            className={`w-full bg-transparent outline-none pr-24 ${isLg ? 'pl-12 text-base' : 'pl-10 text-sm'} ${isDark ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-400'}`}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
              className={`absolute right-[88px] ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit"
            className={`absolute right-2 font-medium rounded-lg transition-colors ${isLg ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} ${isDark ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            Найти
          </button>
        </div>
      </form>

      {/* Дропдаун */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((r) => (
            <button key={r.id} onClick={() => { router.push(`/company/${r.bin}`); setIsOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-none">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{r.name_ru}</div>
                <div className="text-xs text-gray-400 truncate">{r.bin} · {r.city || 'Казахстан'} · {r.legal_form}</div>
              </div>
              <div className={`text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-full border ${
                r.risk_score >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                r.risk_score >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                'text-red-700 bg-red-50 border-red-200'
              }`}>{r.risk_score}</div>
            </button>
          ))}
          <button onClick={() => handleSubmit()}
            className="w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 text-center font-medium border-t border-gray-100">
            Все результаты по «{query}» →
          </button>
        </div>
      )}

      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 text-center text-sm text-gray-500">
          Компания не найдена. Проверьте написание или введите БИН.
        </div>
      )}
    </div>
  )
}
