'use client'

import { useState } from 'react'
import { Send, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { jobId: string; companyId: string; jobTitle: string }

export default function ApplySection({ jobId, companyId, jobTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', cover_letter: '' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('job_applications').insert([{
        job_id: jobId,
        company_id: companyId,
        applicant_name: form.name,
        applicant_email: form.email,
        cover_letter: form.cover_letter || null,
        status: 'new',
      }])
      if (error) { alert(`Ошибка: ${error.message}`); return }

      // Увеличиваем счётчик откликов
      try { await supabase.rpc('increment_job_applications', { job_id: jobId }) } catch {}

      setSubmitted(true)
    } catch (err) { alert('Что-то пошло не так.') }
    finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-semibold text-emerald-900 mb-1">Отклик отправлен!</h3>
        <p className="text-sm text-emerald-700">
          Работодатель увидит ваш отклик и свяжется с вами по email <strong>{form.email}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">Откликнуться на вакансию</div>
            <div className="text-xs text-gray-400">Отклик получит HR и свяжется с вами</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleApply} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ваше имя *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="Имя Фамилия"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
              placeholder="your@email.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Сопроводительное письмо
              <span className="text-gray-400 font-normal ml-1">— необязательно</span>
            </label>
            <textarea value={form.cover_letter} onChange={e => set('cover_letter', e.target.value)}
              rows={4} placeholder="Расскажите почему вы подходите для этой позиции..."
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Отправляем...' : 'Отправить отклик'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Нажимая кнопку, вы соглашаетесь на передачу контактных данных работодателю
          </p>
        </form>
      )}
    </div>
  )
}
