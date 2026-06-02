import { formatMoney, formatDate } from '@/lib/utils'
import type { Company, TaxRecord } from '@/types'

interface CompanyInfoProps {
  company: Company
  taxRecords: TaxRecord[]
}

export function CompanyInfo({ company, taxRecords }: CompanyInfoProps) {
  const rows: { label: string; value: string | null }[] = [
    { label: 'БИН', value: company.bin },
    { label: 'Правовая форма', value: company.legal_form },
    { label: 'Дата регистрации', value: formatDate(company.registration_date) },
    { label: 'Отрасль', value: company.industry_name },
    { label: 'Регион', value: company.region },
    { label: 'Адрес', value: company.address },
    { label: 'Директор', value: company.director_name },
    { label: 'Уставной капитал', value: formatMoney(company.charter_capital) },
    { label: 'Размер компании', value: company.employee_range ? `${company.employee_range} сотрудников` : null },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 text-sm">Сведения о компании</h2>
      </div>
      <div className="divide-y divide-slate-50">
        {rows.filter((r) => r.value && r.value !== '—').map((row) => (
          <div key={row.label} className="px-5 py-3">
            <div className="text-xs text-slate-400 mb-0.5">{row.label}</div>
            <div className="text-sm text-slate-700 font-medium">{row.value}</div>
          </div>
        ))}
      </div>

      {/* Налоговые данные */}
      {taxRecords.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">Налоговые ограничения</div>
          {taxRecords.map((record) => (
            <div key={record.id} className="text-sm text-red-700 mb-1">
              {record.description || record.record_type}
              {record.amount ? ` · ${formatMoney(record.amount)}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
