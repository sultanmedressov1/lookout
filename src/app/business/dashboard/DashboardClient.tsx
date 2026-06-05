'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, RotateCcw } from 'lucide-react'

export default function DashboardClient({ jobs: initialJobs, applications, companySlug }: {
  jobs: any[]; applications: any[]; companySlug: string
}) {
  const [jobs, setJobs] = useState(initialJobs)
  const [closing, setClosing] = useState<string | null>(null)

  const closeJob = async (jobId: string) => {
    if (!confirm('Закрыть вакансию?')) return
    setClosing(jobId)
    const res = await fetch('/api/jobs/close', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    })
    if (res.ok) setJobs(p => p.map(j => j.id === jobId ? { ...j, is_active: false } : j))
    setClosing(null)
  }

  const restoreJob = async (jobId: string) => {
    setClosing(jobId)
    const res = await fetch('/api/jobs/restore', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    })
    if (res.ok) setJobs(p => p.map(j => j.id === jobId ? { ...j, is_active: true } : j))
    setClosing(null)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Вакансии */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Вакансии</h2>
          <Link href="/jobs/add" className="text-sm text-blue-600 hover:text-blue-800">+ Добавить</Link>
        </div>
        {jobs.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            <Link href="/jobs/add" className="text-blue-600">Разместить первую →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => (
              <div key={job.id} className={`flex items-center gap-3 px-5 py-3.5 ${!job.is_active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                    {job.title}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                    <span>{job.views_count || 0} просмотров</span>
                    {(job.applications_count || 0) > 0 && (
                      <Link href={`/business/applications/${job.id}`} className="text-blue-600 font-medium">
                        {job.applications_count} откликов →
                      </Link>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {job.is_active ? 'Активна' : 'Закрыта'}
                </span>
                {job.is_active && (
                  <button onClick={() => closeJob(job.id)} disabled={closing === job.id}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Закрыть вакансию">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!job.is_active && (
                  <button onClick={() => restoreJob(job.id)} disabled={closing === job.id}
                    className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                    title="Восстановить вакансию">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Отклики */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Последние отклики</h2>
        </div>
        {applications.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Откликов пока нет</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {applications.map((app: any) => (
              <div key={app.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-700">{app.applicant_name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{app.applicant_name}</div>
                  <Link href={`/business/applications/${app.job_id}`} className="text-xs text-gray-400 hover:text-blue-600 truncate block">
                    {(app.jobs as any)?.title}
                  </Link>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  app.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  app.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {app.status === 'new' ? 'Новый' : app.status === 'shortlisted' ? 'Шортлист' : app.status === 'rejected' ? 'Отклонён' : 'Просмотрен'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ссылки */}
      {companySlug && (
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          <Link href={`/company/${companySlug}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 text-sm mb-1">Страница компании</div>
              <div className="text-xs text-gray-500">Как видят вас кандидаты</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </Link>
          <Link href="/jobs"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 text-sm mb-1">Все вакансии</div>
              <div className="text-xs text-gray-500">Смотреть конкурентов</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      )}
    </div>
  )
}
