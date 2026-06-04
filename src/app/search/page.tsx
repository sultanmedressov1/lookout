import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { CompanyCard } from '@/components/search/CompanyCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import { Search } from 'lucide-react'

export async function generateMetadata({ searchParams }: any): Promise<Metadata> {
  const q = searchParams.q || ''
  return { title: q ? `«${q}» — поиск компаний | Lookout` : 'Поиск работодателей | Lookout' }
}

const CITIES = ['Алматы','Астана','Шымкент','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Кызылорда','Уральск','Петропавловск','Актау']
const INDUSTRIES = ['Строительство','Торговля','Информационные технологии','Банковская деятельность','Транспорт','Производство','Телекоммуникации','Образование','Медицина']
const PER_PAGE = 20

export default async function SearchPage({ searchParams }: any) {
  const supabase = createClient()
  const query = searchParams.q?.trim() || ''
  const city = searchParams.city || ''
  const risk = searchParams.risk || ''
  const industry = searchParams.industry || ''
  const page = parseInt(searchParams.page || '1', 10)
  const offset = (page - 1) * PER_PAGE

  let dbQuery = supabase.from('companies').select('*', { count: 'exact' })

  if (query) dbQuery = dbQuery.ilike('name_ru', `%${query}%`)
  if (city) dbQuery = dbQuery.eq('city', city)
  if (industry) dbQuery = dbQuery.ilike('industry_name', `%${industry}%`)
  if (risk === 'high') dbQuery = dbQuery.gte('risk_score', 70)
  if (risk === 'medium') dbQuery = dbQuery.gte('risk_score', 40).lt('risk_score', 70)
  if (risk === 'low') dbQuery = dbQuery.lt('risk_score', 40)

  const { data: companies, count } = await dbQuery
    .order('reviews_count', { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  const total = count || 0
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <SearchBar defaultValue={query} size="default" />
          </div>
          {query && (
            <p className="text-sm text-gray-500 mt-3">
              {total > 0
                ? <>Найдено <span className="font-medium text-gray-900">{total}</span> компаний по запросу «{query}»</>
                : <>По запросу «{query}» ничего не найдено</>}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <SearchFilters cities={CITIES} industries={INDUSTRIES}
              selectedCity={city} selectedRisk={risk} selectedIndustry={industry} query={query} />
          </aside>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {total > 0 ? `${offset + 1}–${Math.min(offset + PER_PAGE, total)} из ${total}` : ''}
              </span>
            </div>
            {!companies || companies.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {query ? `По запросу «${query}» ничего не найдено` : 'Введите название компании'}
                </h3>
                <p className="text-sm text-gray-400">Попробуйте изменить запрос или убрать фильтры</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map(company => <CompanyCard key={company.id} company={company as any} />)}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                {page > 1 && <a href={`/search?q=${query}&city=${city}&page=${page-1}`} className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">←</a>}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <a key={p} href={`/search?q=${query}&city=${city}&page=${p}`}
                    className={`px-3 py-2 text-sm rounded-lg border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'}`}>{p}</a>
                ))}
                {page < totalPages && <a href={`/search?q=${query}&city=${city}&page=${page+1}`} className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">→</a>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
