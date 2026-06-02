import { getStatusLabel, getStatusColor } from '@/lib/utils'
import { CompanyStatus } from '@/types'

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
      {getStatusLabel(status)}
    </span>
  )
}
