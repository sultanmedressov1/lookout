'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, Loader2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { size?: 'default' | 'lg'; defaultValue?: string; theme?: 'light' | 'dark' }

export function SearchBar({ size = 'default', defaultValue = '', theme = 'light' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const { data } = await createClient().from('companies')
        .select('id, short_id, name_ru, city, industry_name, avg_rating, reviews_count')
        .ilike('name_ru', `%${q.trim()}%`).limit(6)
      setResults(data || [])
      setOpen(true)
    } finally { setLoading(false) }
  }, [])

  const handleInput = (v: string) => {
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  const navigate = (c: any) => { router.push(`/company/${c.short_id}`); setOpen(false); setQuery(c.name_ru) }
  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setOpen(false) } }

  const isLg = size === 'lg'
  const isDark = theme === 'dark'
  const bg = isDark ? 'bg-white/10 border-white/20 text-white placeholder-white/50' : 'bg-white border-gray-200 focus-within:border-blue-500 focus-within:shadow-sm'

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center border-2 rounded-xl ${isLg ? 'h-14' : 'h-11'} ${bg}`}>
          {loading
            ? <Loader2 className={`absolute left-4 animate-spin ${isDark ? 'text-white/60' : 'text-gray-400'} ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`} />
            : <Search className={`absolute left-4 ${isDark ? 'text-white/60' : 'text-gray-400'} ${isLg ? 'w-5 h-5' : 'w-4 h-4'}`} />}
          <input type="text" value={query} onChange={e => handleInput(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Название компании..."
            className={`w-full bg-transparent outline-none pr-24 ${isLg ? 'pl-12 text-base' : 'pl-10 text-sm'} ${isDark ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-400'}`} />
          {query && <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false) }} className={`absolute right-[88px] ${isDark ? 'text-white/60' : 'text-gray-400'}`}><X className="w-4 h-4" /></button>}
          <button type="submit" className={`absolute right-2 font-medium rounded-lg ${isLg ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} ${isDark ? 'bg-white text-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Найти</button>
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map(r => (
            <button key={r.id} onClick={() => navigate(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-gray-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{r.name_ru}</div>
                <div className="text-xs text-gray-400">{r.city}{r.industry_name ? ` · ${r.industry_name}` : ''}</div>
              </div>
              {r.avg_rating > 0 && r.reviews_count > 0 && (
                <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-sm font-medium text-gray-700">{Number(r.avg_rating).toFixed(1)}</span></div>
              )}
            </button>
          ))}
          <button onClick={() => handleSubmit()} className="w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 text-center border-t border-gray-100">Все результаты по «{query}» →</button>
        </div>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 text-center text-sm text-gray-500">
          Компания не найдена. <button onClick={() => handleSubmit()} className="text-blue-600">Искать дальше →</button>
        </div>
      )}
    </div>
  )
}
