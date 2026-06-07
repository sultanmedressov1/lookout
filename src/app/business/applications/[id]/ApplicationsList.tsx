'use client'

import { useState } from 'react'
import { Mail, Clock, User, ChevronDown, ExternalLink, Phone, MapPin, Bell, StickyNote } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:         { label: 'Новый',       color: 'text-blue-700 bg-blue-50 border-blue-200' },
  viewed:      { label: 'Просмотрен',  color: 'text-gray-600 bg-gray-50 border-gray-200' },
  shortlisted: { label: 'В шортлисте', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  rejected:    { label: 'Отклонён',    color: 'text-red-600 bg-red-50 border-red-200' },
}

const NOTIFY_ACTIONS = [
  { value: 'invite_interview', label: 'Пригласить на интервью', msg: (t: string) => `Вас приглашают на собеседование по вакансии «${t}»` },
  { value: 'offer',           label: 'Отправить оффер',        msg: (t: string) => `Вам предложили оффер по вакансии «${t}»` },
  { value: 'waitlist',        label: 'Поставить в резерв',     msg: (t: string) => `Ваша кандидатура добавлена в резерв по вакансии «${t}»` },
  { value: 'reject',          label: 'Отказать',               msg: (t: string) => `Отказ по вакансии «${t}»` },
]

const EXT_LABELS: Record<string, string> = {
  invite_interview: 'Приглашён на интервью',
  offer: 'Оффер отправлен',
  waitlist: 'В резерве',
  reject: 'Отказ',
}

export default function ApplicationsList({ applications: initial, jobId, jobTitle }: {
  applications: any[]; jobId: string; jobTitle: string
}) {
  const [items, setItems] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>(
    Object.fromEntries(initial.map(a => [a.id, a.company_notes || '']))
  )
  const [saving, setSaving] = useState<string | null>(null)

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/applications/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setItems(p => p.map(a => a.id === id ? { ...a, status } : a))
  }

  const saveNote = async (id: string) => {
    setSaving(id)
    await fetch('/api/applications/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: noteDraft[id] }),
    })
    setItems(p => p.map(a => a.id === id ? { ...a, company_notes: noteDraft[id] } : a))
    setEditingNote(null)
    setSaving(null)
  }

  const notify = async (appId: string, action: string, workerUserId: string | null) => {
    if (!workerUserId) { alert('Кандидат не зарегистрирован на платформе'); return }
    const def = NOTIFY_ACTIONS.find(a => a.value === action)
    if (!def) return

    await Promise.all([
      fetch('/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: workerUserId, type: action, title: def.label, message: def.msg(jobTitle), link: `/jobs/${jobId}` }),
      }),
      fetch('/api/applications/external-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, external_status: action }),
      }),
    ])
    setItems(p => p.map(a => a.id === appId ? { ...a, external_status: action } : a))
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Откликов пока нет</p>
      </div>
    )
  }

  return (
    <div>
      {/* Сводка */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{items.filter(a => a.status === s).length}</div>
            <div className="text-xs text-gray-400 mt-1">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-3">
        {items.map(app => {
          const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.new
          const isOpen = expanded === app.id
          return (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Строка кандидата */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-600">
                  {app.applicant_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {app.worker_profile_id
                        ? <Link href={`/workers/${app.worker_profile_id}`} className="hover:text-blue-600 transition-colors">{app.applicant_name}</Link>
                        : app.applicant_name}
                    </span>
                    {app.worker_profile_id && (
                      <Link href={`/workers/${app.worker_profile_id}`} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" /> Профиль
                      </Link>
                    )}
                    {app.company_notes && (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Заметка</span>
                    )}
                    {app.external_status && (
                      <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        {EXT_LABELS[app.external_status]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                    <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="w-3 h-3" />{app.applicant_email}
                    </a>
                    {app.applicant_phone && (
                      <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1 hover:text-gray-600">
                        <Phone className="w-3 h-3" />{app.applicant_phone}
                      </a>
                    )}
                    {app.applicant_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.applicant_city}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                  <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                    className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400 cursor-pointer">
                    {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                  <button onClick={() => setExpanded(isOpen ? null : app.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Раскрытая часть */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">

                  {/* Текст сопроводительного */}
                  {(app.cover_letter || app.applicant_about) && (
                    <div>
                      {app.applicant_about && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">О себе</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{app.applicant_about}</p>
                        </div>
                      )}
                      {app.cover_letter && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Сопроводительное письмо</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Личная заметка */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5" /> Личная заметка <span className="text-gray-300 normal-case font-normal">(видите только вы)</span>
                      </p>
                      {editingNote !== app.id && (
                        <button onClick={() => setEditingNote(app.id)} className="text-xs text-gray-400 hover:text-gray-600">Изменить</button>
                      )}
                    </div>

                    {editingNote === app.id ? (
                      <div>
                        <textarea value={noteDraft[app.id]} onChange={e => setNoteDraft(p => ({ ...p, [app.id]: e.target.value }))}
                          rows={3} placeholder="Например: хорошие навыки, но нужно проверить английский..."
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 resize-none mb-2 bg-amber-50/30" />
                        <div className="flex gap-2">
                          <button onClick={() => saveNote(app.id)} disabled={saving === app.id}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                            {saving === app.id ? 'Сохраняем...' : 'Сохранить'}
                          </button>
                          <button onClick={() => setEditingNote(null)} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setEditingNote(app.id)}
                        className="text-sm text-gray-500 bg-amber-50/40 border border-amber-100 rounded-xl p-3 min-h-[40px] cursor-text">
                        {app.company_notes || <span className="text-gray-300 italic">Нажмите чтобы добавить заметку...</span>}
                      </div>
                    )}
                  </div>

                  {/* Уведомить кандидата */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Уведомить кандидата
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {NOTIFY_ACTIONS.map(action => (
                        <button key={action.value} onClick={() => notify(app.id, action.value, app.worker_user_id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            app.external_status === action.value
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                          }`}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                    {!app.worker_user_id && (
                      <p className="text-xs text-gray-400 mt-1.5">Кандидат откликнулся без регистрации — уведомление отправить нельзя</p>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <a href={`mailto:${app.applicant_email}?subject=Re: ${encodeURIComponent(jobTitle)}`}
                      className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                      <Mail className="w-4 h-4" /> Написать письмо
                    </a>
                    {app.worker_profile_id && (
                      <Link href={`/workers/${app.worker_profile_id}`}
                        className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4" /> Полный профиль
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
