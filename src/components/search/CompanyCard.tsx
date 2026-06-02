import Link from 'next/link'
import { Building2, MapPin, Scale, AlertTriangle, Star, Calendar } from 'lucide-react'
import { formatBin, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { Company } from '@/types'

interface CompanyCardProps {
  company: Company
}

export function CompanyCard({ company }: CompanyCardProps) {
  const score = company.risk_score
  const scoreColor = score >= 70
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 40
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200'

  const scoreLabel = score >= 70 ? 'Надёжная' : score >= 40 ? 'Умеренный риск' : 'Высокий риск'

  const year = company.registration_date
    ? new Date(company.registration_date).getFullYear()
    : null

  return (
    <Link href={`/company/${company.bin}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">

          {/* Лево */}
          <div className="flex gap-4 flex-1 min-w-0">
            {/* Иконка */}
            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>

            {/* Основное */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{company.name_ru}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(company.status)}`}>
                  {company.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {getStatusLabel(company.status)}
                </span>
              </div>

              {/* Мета */}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                {company.legal_form && <span>{company.legal_form}</span>}
                {company.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{company.city}
                  </span>
                )}
                {company.industry_name && <span className="truncate max-w-[160px]">{company.industry_name}</span>}
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />С {year}
                  </span>
                )}
              </div>

              {/* Предупреждения */}
              {(company.has_tax_debt || company.active_cases_count > 0) && (
                <div className="flex gap-2 mt-2">
                  {company.active_cases_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Scale className="w-3 h-3" />
                      {company.active_cases_count} активных судов
                    </span>
                  )}
                  {company.has_tax_debt && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3" />
                      Налоговый долг
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Право — скор и рейтинг */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className={`px-3 py-1.5 rounded-lg border text-center min-w-[80px] ${scoreColor}`}>
              <div className="text-lg font-bold leading-none">{score}</div>
              <div className="text-xs mt-0.5">{scoreLabel}</div>
            </div>

            {company.reviews_count > 0 && company.avg_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="font-medium text-gray-700">{company.avg_rating.toFixed(1)}</span>
                <span>({company.reviews_count})</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </Link>
  )
}
