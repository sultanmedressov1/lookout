import Link from 'next/link'
import { Building2, MapPin, Star, Users, Briefcase } from 'lucide-react'

export function CompanyCard({ company }: { company: any }) {
  const href = `/company/${company.slug || company.bin || company.id}`

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{company.name_ru}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
              {company.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.city}</span>}
              {company.industry_name && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{company.industry_name}</span>}
            </div>
            {company.reviews_count > 0 && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {company.avg_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-gray-700">{Number(company.avg_rating).toFixed(1)}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />{company.reviews_count} отзывов
                </span>
              </div>
            )}
          </div>
          {company.reviews_count === 0 && (
            <span className="text-xs text-gray-300 flex-shrink-0">Нет отзывов</span>
          )}
        </div>
      </div>
    </Link>
  )
}
