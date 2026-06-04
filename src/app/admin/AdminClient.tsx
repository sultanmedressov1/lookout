'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

type Tab = 'requests' | 'reviews' | 'interviews' | 'salaries'

export default function AdminClient({ empReviews, interviews, salaries, requests }: {
  empReviews: any[]; interviews: any[]; salaries: any[]; requests: any[]
}) {
  const [tab, setTab] = useState<Tab>('requests')
  const [data, setData] = useState({ empReviews, interviews, salaries, requests })
  const [loading, setLoading] = useState<string | null>(null)

  const pending = data.requests.filter(r => r.status === 'pending').length

  const tabs = [
    { id: 'requests' as Tab, label: 'Заявки', count: pending, urgent: pending > 0 },
    { id: 'reviews' as Tab, label: 'Отзывы', count: data.empReviews.length },
    { id: 'interviews' as Tab, label: 'Интервью', count: data.interviews.length },
    { id: 'salaries' as Tab, label: 'Зарплаты', count: data.salaries.length },
  ]

  const api = async (url: string, body: any) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (!res.ok) { alert(`Ошибка: ${d.error}`); return null }
    return d
  }

  const toggle = async (id: string, published: boolean, table: string, key: keyof typeof data) => {
    setLoading(id)
    const r = await api('/api/admin/review', { action: 'toggle', id, table, published })
    if (r) setData(p => ({ ...p, [key]: (p[key] as any[]).map((x: any) => x.id === id ? { ...x, is_published: r.is_published } : x) }))
    setLoading(null)
  }

  const del = async (id: string, table: string, key: keyof typeof data) => {
    if (!confirm('Удалить? Это действие нельзя отменить.')) return
    setLoading(id)
    const r = await api('/api/admin/review', { action: 'delete', id, table })
    if (r) setData(p => ({ ...p, [key]: (p[key] as any[]).filter((x: any) => x.id !== id) }))
    setLoading(null)
  }

  const updateReq = async (id: string, status: string) => {
    setLoading(id)
    const r = await api('/api/admin/request', { id, status })
    if (r) setData(p => ({ ...p, requests: p.requests.map(x => x.id === id ? { ...x, status } : x) }))
    setLoading(null)
  }

  const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n/1_000)}K` : String(n)

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Lookout Moderation</span>
        </div>

        <div className="flex gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.id ? 'bg-blue-500 text-white' : t.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <div className="space-y-3">
            {data.requests.length === 0 && <Empty text="Заявок нет" />}
            {data.requests.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{r.company_name}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <div>БИН: <span className="font-mono text-gray-700">{r.company_bin}</span></div>
                      <div>{r.contact_name} · <a href={`mailto:${r.contact_email}`} className="text-blue-600">{r.contact_email}</a></div>
                      <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ru-RU')}</div>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <ActionBtn loading={loading === r.id} onClick={() => updateReq(r.id, 'approved')} icon={<CheckCircle2 className="w-4 h-4" />} label="Одобрить" className="bg-emerald-600 hover:bg-emerald-700 text-white" />
                      <ActionBtn loading={loading === r.id} onClick={() => updateReq(r.id, 'rejected')} icon={<XCircle className="w-4 h-4" />} label="Отклонить" className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <ContentList items={data.empReviews} loading={loading}
            onToggle={(id, pub) => toggle(id, pub, 'reviews_employee', 'empReviews')}
            onDelete={(id) => del(id, 'reviews_employee', 'empReviews')}
            renderMeta={(r) => `${r.rating_overall}/5 ★`} />
        )}

        {tab === 'interviews' && (
          <ContentList items={data.interviews} loading={loading}
            onToggle={(id, pub) => toggle(id, pub, 'reviews_interview', 'interviews')}
            onDelete={(id) => del(id, 'reviews_interview', 'interviews')}
            renderMeta={(r) => r.experience || ''} />
        )}

        {tab === 'salaries' && (
          <ContentList
            items={data.salaries.map(s => ({ ...s, title: s.position_title }))}
            loading={loading}
            onToggle={(id, pub) => toggle(id, pub, 'salaries', 'salaries')}
            onDelete={(id) => del(id, 'salaries', 'salaries')}
            renderMeta={(s) => s.salary_monthly ? `${fmt(s.salary_monthly)} ₸/мес` : ''} />
        )}
      </div>
    </div>
  )
}

function ContentList({ items, loading, onToggle, onDelete, renderMeta }: any) {
  if (items.length === 0) return <Empty text="Записей нет" />
  return (
    <div className="space-y-3">
      {items.map((r: any) => (
        <div key={r.id} className={`bg-white rounded-xl border p-4 transition-opacity ${loading === r.id ? 'opacity-50' : ''} ${!r.is_published ? 'border-red-200 bg-red-50/20' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-gray-900 truncate">{r.title}</span>
                {!r.is_published && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0">Скрыт</span>}
              </div>
              {r.companies && <span className="text-xs text-blue-600">{r.companies.name_ru}</span>}
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(r.created_at).toLocaleDateString('ru-RU')}
                {renderMeta(r) && ` · ${renderMeta(r)}`}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => onToggle(r.id, r.is_published)} disabled={loading === r.id}
                className={`p-2 rounded-lg transition-colors ${r.is_published ? 'text-gray-400 hover:bg-gray-100' : 'text-emerald-600 hover:bg-emerald-50'}`}
                title={r.is_published ? 'Скрыть' : 'Показать'}>
                {r.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => onDelete(r.id)} disabled={loading === r.id}
                className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Удалить">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActionBtn({ onClick, icon, label, className, loading }: any) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${className}`}>
      {icon}{label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: any = { pending:'bg-amber-100 text-amber-700', approved:'bg-emerald-100 text-emerald-700', rejected:'bg-red-100 text-red-700' }
  const labels: any = { pending:'На проверке', approved:'Одобрен', rejected:'Отклонён' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>{labels[status] || status}</span>
}

function Empty({ text }: { text: string }) {
  return <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">{text}</div>
}
