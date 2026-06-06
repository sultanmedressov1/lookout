'use client'

import { useState } from 'react'
import { Mail, Clock, User, ChevronDown, ExternalLink, Phone, MapPin, Bell, StickyNote, Save } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', viewed: 'Просмотрен', shortlisted: 'В шортлисте', rejected: 'Отклонён'
}
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', viewed: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600',
}

// Внешние действия — отправляют уведомления работнику
const EXTERNAL_ACTIONS = [
  { value: 'invite_interview', label: '📅 Пригласить на интервью', msg: (title: string) => `Компания приглашает вас на собеседование по вакансии «${title}»` },
  { value: 'offer', label: '🎉 Отправить оффер', msg: (title: string) => `Вам сделали предложение о работе по вакансии «${title}»` },
  { value: 'waitlist', label: '⏳ Добавить в резерв', msg: (title: string) => `Ваша кандидатура добавлена в резерв по вакансии «${title}»` },
  { value: 'reject', label: '❌ Отказать (с уведомлением)', msg: (title: string) => `К сожалению, ваша кандидатура по вакансии «${title}» не прошла отбор` },
]

export default function ApplicationsList({ applications: initial, jobId, jobTitle }: {
  applications: any[]; jobId: string; jobTitle: string
}) {
  const [items, setItems] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notesEditing, setNotesEditing] = useState<string | null>(null)
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>(
    Object.fromEntries(initial.map(a => [a.id, a.company_notes || '']))
  )
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [sendingAction, setSendingAction] = useState<string | null>(null)

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/applications/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) setItems(p => p.map(a => a.id === id ? { ...a, status } : a))
  }

  const saveNote = async (id: string) => {
    setSavingNote(id)
    const app = items.find(a => a.id === id)
    await fetch('/api/applications/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: noteTexts[id] }),
    })
    setItems(p => p.map(a => a.id === id ? { ...a, company_notes: noteTexts[id] } : a))
    setNotesEditing(null)
    setSavingNote(null)
  }

  const sendExternalAction = async (appId: string, action: string, workerUserId: string | null) => {
    if (!workerUserId) { alert('Работник не авторизован — нет возможности отправить уведомление'); return }
    setSendingAction(appId + action)
    const actionDef = EXTERNAL_ACTIONS.find(a => a.value === action)
    if (!actionDef) return

    await fetch('/api/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: workerUserId,
        type: action,
        title: actionDef.label.replace(/^[^\w]+/, ''),
        message: actionDef.msg(jobTitle),
        link: `/jobs/${jobId}`,
      }),
    })

    // Обновляем external_status в БД
    await fetch('/api/applications/external-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, external_status: action }),
    }).catch(() => {})

    setItems(p => p.map(a => a.id === appId ? { ...a, external_status: action } : a))
    setSendingAction(null)
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <User className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Откликов пока нет</h3>
      </div>
    )
  }

  const extLabels: Record<string, string> = {
    invite_interview: '📅 Приглашён на интервью', offer: '🎉 Оффер отправлен',
    waitlist: '⏳ В резерве', reject: '❌ Отказ отправлен'
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
          {/* Строка кандидата */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-700">{app.applicant_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{app.applicant_name}</span>
                {app.worker_profile_id && (
                  <Link href={`/workers/${app.worker_profile_id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                    <ExternalLink className="w-3 h-3" /> Профиль
                  </Link>
                )}
                {app.company_notes && (
                  <span title={app.company_notes} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full cursor-help">📝 Заметка</span>
                )}
                {app.external_status && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{extLabels[app.external_status]}</span>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1 text-blue-600"><Mail className="w-3 h-3" />{app.applicant_email}</a>
                {app.applicant_phone && <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.applicant_phone}</a>}
                {app.applicant_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.applicant_city}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Внутренний статус */}
              <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <ChevronDown className={`w-4 h-4 transition-transform ${expanded === app.id ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Раскрытая карточка */}
          {expanded === app.id && (
            <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">

              {/* О себе + сопроводительное */}
              {app.applicant_about && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">О себе</div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{app.applicant_about}</p>
                </div>
              )}
              {app.cover_letter && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Сопроводительное</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                </div>
              )}

              {/* Заметки компании (#22) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                    <StickyNote className="w-3 h-3" /> Заметки (видите только вы)
                  </div>
                  {notesEditing !== app.id && (
                    <button onClick={() => setNotesEditing(app.id)} className="text-xs text-gray-400 hover:text-gray-600">Изменить</button>
                  )}
                </div>
                {notesEditing === app.id ? (
                  <div>
                    <textarea value={noteTexts[app.id]} onChange={e => setNoteTexts(p => ({ ...p, [app.id]: e.target.value }))}
                      rows={3} placeholder="Хороший кандидат, нужно проверить английский... Только для внутреннего использования."
                      className="w-full text-sm border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 resize-none mb-2" />
                    <div className="flex gap-2">
                      <button onClick={() => saveNote(app.id)} disabled={savingNote === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg">
                        <Save className="w-3.5 h-3.5" /> {savingNote === app.id ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                      <button onClick={() => setNotesEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setNotesEditing(app.id)}
                    className="text-sm text-gray-500 bg-amber-50/50 border border-amber-100 rounded-xl p-3 min-h-[40px] cursor-text italic">
                    {app.company_notes || <span className="text-gray-300">Нажмите чтобы добавить заметку...</span>}
                  </div>
                )}
              </div>

              {/* Внешние действия с уведомлениями (#21) */}
              <div>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Уведомить кандидата
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXTERNAL_ACTIONS.map(action => (
                    <button key={action.value}
                      onClick={() => sendExternalAction(app.id, action.value, app.worker_user_id)}
                      disabled={sendingAction === app.id + action.value || app.external_status === action.value}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        app.external_status === action.value
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                      } disabled:opacity-50`}>
                      {action.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Кандидат получит уведомление на Lookout</p>
              </div>

              {/* Действия */}
              <div className="flex gap-2">
                <a href={`mailto:${app.applicant_email}`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <Mail className="w-4 h-4" /> Написать
                </a>
                {app.worker_profile_id && (
                  <Link href={`/workers/${app.worker_profile_id}`}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50">
                    <ExternalLink className="w-4 h-4" /> Полный профиль
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
