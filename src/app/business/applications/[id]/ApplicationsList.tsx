'use client'

import { useState } from 'react'
import { Mail, Clock, User, ChevronDown } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', viewed: 'Просмотрен',
  shortlisted: 'В шортлисте', rejected: 'Отклонён'
}
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  viewed: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function ApplicationsList({ applications, jobId }: { applications: any[]; jobId: string }) {
  const [items, setItems] = useState(applications)
  const [expanded, setExpanded] = useState<string | null>(null)

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/applications/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setItems(p => p.map(a => a.id === id ? { ...a, status } : a))
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Откликов пока нет</h3>
        <p className="text-sm text-gray-400">Отклики появятся здесь когда кандидаты откликнутся на вакансию</p>
      </div>
    )
  }

  const byStatus = {
    new: items.filter(a => a.status === 'new').length,
    shortlisted: items.filter(a => a.status === 'shortlisted').length,
  }

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(STATUS_LABELS).map(([s, l]) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-xl font-bold text-gray-900">{items.filter(a => a.status === s).length}</div>
            <div className="text-xs text-gray-400 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Список */}
      {items.map(app => (
        <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Аватар */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-700">
                {app.applicant_name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Инфо */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">{app.applicant_name}</div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <Mail className="w-3 h-3" />{app.applicant_email}
                </a>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(app.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            {/* Статус + действия */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
              <select
                value={app.status}
                onChange={e => updateStatus(app.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded === app.id ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Сопроводительное письмо */}
          {expanded === app.id && (
            <div className="px-5 pb-5 border-t border-gray-50">
              <div className="pt-4">
                {app.cover_letter ? (
                  <>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Сопроводительное письмо
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                      {app.cover_letter}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">Сопроводительное письмо не добавлено</p>
                )}
                <div className="mt-4">
                  <a href={`mailto:${app.applicant_email}?subject=Re: ${encodeURIComponent('Вакансия на Lookout')}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    <Mail className="w-4 h-4" /> Написать кандидату
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
