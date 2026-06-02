'use client'

import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'

interface Props {
  cities: string[]
  industries: string[]
  selectedCity: string
  selectedRisk: string
  selectedIndustry: string
  query: string
}

export function SearchFilters({ cities, industries, selectedCity, selectedRisk, selectedIndustry, query }: Props) {
  const router = useRouter()

  const update = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (key !== 'city' && selectedCity) params.set('city', selectedCity)
    if (key !== 'risk' && selectedRisk) params.set('risk', selectedRisk)
    if (key !== 'industry' && selectedIndustry) params.set('industry', selectedIndustry)
    if (value) params.set(key, value)
    params.delete('page')
    router.push(`/search?${params}`)
  }

  const clearAll = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/search?${params}`)
  }

  const hasFilters = selectedCity || selectedRisk || selectedIndustry

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
        </div>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
            <X className="w-3 h-3" />Сбросить
          </button>
        )}
      </div>

      {/* Риск */}
      <FilterGroup title="Уровень риска">
        {[
          { value: 'high', label: 'Надёжные', color: 'text-emerald-700', dot: 'bg-emerald-500' },
          { value: 'medium', label: 'Умеренный риск', color: 'text-amber-700', dot: 'bg-amber-500' },
          { value: 'low', label: 'Высокий риск', color: 'text-red-700', dot: 'bg-red-500' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => update('risk', selectedRisk === opt.value ? '' : opt.value)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedRisk === opt.value
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
            {opt.label}
          </button>
        ))}
      </FilterGroup>

      {/* Город */}
      <FilterGroup title="Город">
        <select
          value={selectedCity}
          onChange={e => update('city', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">Все города</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterGroup>

      {/* Отрасль */}
      <FilterGroup title="Отрасль">
        <select
          value={selectedIndustry}
          onChange={e => update('industry', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">Все отрасли</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  )
}
