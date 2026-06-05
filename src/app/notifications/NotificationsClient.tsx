'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Briefcase, Star, CheckCircle2, Users, Clock } from 'lucide-react'

const TYPE_ICONS: Record<string, any> = {
  new_application: Users,
  review_approved: Star,
  job_closed: Briefcase,
  default: Bell,
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}

export default function NotificationsClient({ notifications }: { notifications: any[] }) {
  const [items, setItems] = useState(notifications)

  const markAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: 'all' }),
    })
    setItems(p => p.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setItems(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unread = items.filter(n => !n.is_read).length

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Уведомлений нет</h3>
        <p className="text-sm text-gray-400">Здесь будут появляться важные события</p>
      </div>
    )
  }

  return (
    <div>
      {unread > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{unread} непрочитанных</span>
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Прочитать все
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(n => {
          const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default
          const content = (
            <div
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                n.is_read ? 'bg-gray-100' : 'bg-blue-100'
              }`}>
                <Icon className={`w-4 h-4 ${n.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                  {n.title}
                </div>
                {n.message && <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>}
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {timeAgo(n.created_at)}
                </div>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
            </div>
          )

          return n.link ? (
            <Link key={n.id} href={n.link}>{content}</Link>
          ) : (
            <div key={n.id}>{content}</div>
          )
        })}
      </div>
    </div>
  )
}
