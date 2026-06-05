'use client'

import { useState } from 'react'
import { Mail, Clock, User, ChevronDown, ExternalLink, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', viewed: 'Просмотрен', shortlisted: 'В шортлисте', rejected: 'Отклонён'
}
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', viewed: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600',
}

export default function ApplicationsList({ applications, jobId }: { applications: any[]; jobId: string }) {
  const [items, setItems] = useState(applications)
  const [expanded, setExpanded] = useState<string | null>(null)

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/applications/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) setItems(p => p.map(a => a.id === id ? { ...a, status } : a))
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Откликов пока нет</h3>
        <p className="text-sm text-gray-400">Отклики появятся здесь когда кандидаты откликнутся</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(STATUS_LABELS).map(([s, l]) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-xl font-bold text-gray-900">{items.filter(a => a.status === s).length}</div>
            <div className="text-xs text-gray-400 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {items.map(app => (
        <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-700">{app.applicant_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{app.applicant_name}</span>
                {app.worker_profile_id && (
                  <Link href={`/workers/${app.worker_profile_id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                    <ExternalLink className="w-3 h-3" /> Профиль
                  </Link>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <Mail className="w-3 h-3" />{app.applicant_email}
                </a>
                {app.applicant_phone && (
                  <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                    <Phone className="w-3 h-3" />{app.applicant_phone}
                  </a>
                )}
                {app.applicant_city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.applicant_city}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
              <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded === app.id ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {expanded === app.id && (
            <div className="px-5 pb-5 border-t border-gray-50 pt-4">
              {app.applicant_about && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">О себе</div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{app.applicant_about}</p>
                </div>
              )}
              {app.cover_letter ? (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Сопроводительное письмо</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Сопроводительное письмо не добавлено</p>
              )}
              <div className="mt-4 flex gap-2">
                <a href={`mailto:${app.applicant_email}?subject=Re: Ваш отклик на вакансию`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <Mail className="w-4 h-4" /> Написать
                </a>
                {app.worker_profile_id && (
                  <Link href={`/workers/${app.worker_profile_id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50">
                    <ExternalLink className="w-4 h-4" /> Открыть профиль
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
