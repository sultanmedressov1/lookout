import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { CompanyCard } from '@/components/search/CompanyCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SlidersHorizontal, Search } from 'lucide-react'

interface PageProps {
  searchParams: {
    q?: string
    city?: string
    risk?: string
    industry?: string
    page?: string
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const q = searchParams.q || ''
  return {
    title: q ? `«${q}» — поиск компаний` : 'Поиск компаний Казахстана',
    description: 'Найдите и проверьте любую компанию Казахстана. Реестр, суды, налоги и отзывы.',
  }
}

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай']
const INDUSTRIES = ['Строительство', 'Торговля', 'Информационные технологии', 'Банковская деятельность', 'Транспорт', 'Производство', 'Телекоммуникации', 'Образование', 'Медицина']

const PER_PAGE = 20

export default async function SearchPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const query = searchParams.q?.trim() || ''
  const city = searchParams.city || ''
  const risk = searchParams.risk || ''
  const industry = searchParams.industry || ''
  const page = parseInt(searchParams.page || '1', 10)
  const offset = (page - 1) * PER_PAGE

  // Строим запрос
  let dbQuery = supabase
    .from('companies')
    .select('*', { count: 'exact' })

  if (query) {
    dbQuery = dbQuery.or(`name_ru.ilike.%${query}%,name_kz.ilike.%${query}%,bin.eq.${query}`)
  }
  if (city) dbQuery = dbQuery.eq('city', city)
  if (industry) dbQuery = dbQuery.ilike('industry_name', `%${industry}%`)
  if (risk === 'high') dbQuery = dbQuery.gte('risk_score', 70)
  if (risk === 'medium') dbQuery = dbQuery.gte('risk_score', 40).lt('risk_score', 70)
  if (risk === 'low') dbQuery = dbQuery.lt('risk_score', 40)

  const { data: companies, count } = await dbQuery
    .order('risk_score', { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  const total = count || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Шапка поиска */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <SearchBar defaultValue={query} size="default" />
          </div>
          {query && (
            <p className="text-sm text-gray-500 mt-3">
              {total > 0
                ? <>Найдено <span className="font-medium text-gray-900">{total}</span> компаний по запросу «{query}»</>
                : <>По запросу «{query}» ничего не найдено</>
              }
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Фильтры */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <SearchFilters
              cities={CITIES}
              industries={INDUSTRIES}
              selectedCity={city}
              selectedRisk={risk}
              selectedIndustry={industry}
              query={query}
            />
          </aside>

          {/* Результаты */}
          <div className="flex-1 min-w-0">

            {/* Сортировка и счётчик */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {total > 0 ? `${offset + 1}–${Math.min(offset + PER_PAGE, total)} из ${total}` : ''}
              </span>
            </div>

            {/* Список */}
            {!companies || companies.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="space-y-3">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company as any} />
                ))}
              </div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                query={query}
                city={city}
                risk={risk}
                industry={industry}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="font-semibold text-gray-900 mb-2">
        {query ? `По запросу «${query}» ничего не найдено` : 'Введите название компании или БИН'}
      </h3>
      <p className="text-sm text-gray-400">
        {query
          ? 'Попробуйте изменить запрос или убрать фильтры'
          : 'Используйте строку поиска выше'}
      </p>
    </div>
  )
}

function Pagination({ page, totalPages, query, city, risk, industry }: {
  page: number; totalPages: number
  query: string; city: string; risk: string; industry: string
}) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (city) params.set('city', city)
  if (risk) params.set('risk', risk)
  if (industry) params.set('industry', industry)

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {page > 1 && (
        <a href={`/search?${params}&page=${page - 1}`}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          ←
        </a>
      )}
      {pages.map(p => {
        params.set('page', String(p))
        return (
          <a key={p} href={`/search?${params}`}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              p === page
                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
            }`}>
            {p}
          </a>
        )
      })}
      {page < totalPages && (
        <a href={`/search?${params}&page=${page + 1}`}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          →
        </a>
      )}
    </div>
  )
}
