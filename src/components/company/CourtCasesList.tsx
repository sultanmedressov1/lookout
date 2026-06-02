import { formatDate, formatMoney } from '@/lib/utils'
import { Scale, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import type { CourtCase } from '@/types'

interface CourtCasesListProps {
  cases: CourtCase[]
  totalCount: number
}

const caseTypeLabels: Record<string, string> = {
  civil: 'Гражданское',
  tax: 'Налоговое',
  criminal: 'Уголовное',
  administrative: 'Административное',
  bankruptcy: 'Банкротство',
}

const caseStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Активное', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  completed: { label: 'Завершено', color: 'text-slate-600 bg-slate-50', icon: CheckCircle2 },
  appeal: { label: 'Апелляция', color: 'text-amber-600 bg-amber-50', icon: Clock },
  enforcement: { label: 'Исполнение', color: 'text-orange-600 bg-orange-50', icon: Clock },
}

export function CourtCasesList({ cases, totalCount }: CourtCasesListProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Судебные дела</h2>
          {totalCount > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          Судебных дел не обнаружено
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {cases.map((c) => {
            const statusConfig = caseStatusConfig[c.case_status || ''] || caseStatusConfig.completed
            const StatusIcon = statusConfig.icon

            return (
              <div key={c.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {c.case_type && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {caseTypeLabels[c.case_type] || c.case_type}
                        </span>
                      )}
                      {c.role && (
                        <span className="text-xs text-slate-400">
                          {c.role === 'defendant' ? 'Ответчик' : c.role === 'plaintiff' ? 'Истец' : c.role}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-700">
                      {c.case_number && <span className="font-medium">№ {c.case_number}</span>}
                      {c.court_name && <span className="text-slate-500"> · {c.court_name}</span>}
                    </div>
                    {c.result && (
                      <div className="text-xs text-slate-400 mt-0.5">{c.result}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.amount && (
                      <div className="text-sm font-medium text-slate-700">{formatMoney(c.amount)}</div>
                    )}
                    <div className="text-xs text-slate-400">{formatDate(c.case_date)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalCount > cases.length && (
        <div className="px-6 py-3 border-t border-slate-100 text-center">
          <span className="text-sm text-slate-400">Показано {cases.length} из {totalCount} дел</span>
        </div>
      )}
    </div>
  )
}
