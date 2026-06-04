import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Clock, User } from 'lucide-react'
import ApplicationsList from './ApplicationsList'

interface Props { params: { id: string } }

export default async function ApplicationsPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.type !== 'business') redirect('/auth/signin')

  const admin = createAdminClient()

  // Проверяем что вакансия принадлежит этому работодателю
  const { data: job } = await admin.from('jobs')
    .select('id, title, company_id')
    .eq('id', params.id)
    .single()

  if (!job) redirect('/business/dashboard')

  const { data: applications } = await admin
    .from('job_applications')
    .select('*')
    .eq('job_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/business/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> Панель управления
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {applications?.length || 0} {(applications?.length || 0) === 1 ? 'отклик' : 'откликов'}
            </p>
          </div>
          <Link href={`/jobs/${job.id}`} className="text-sm text-blue-600 hover:text-blue-800">
            Посмотреть вакансию →
          </Link>
        </div>

        <ApplicationsList applications={applications || []} jobId={job.id} />
      </div>
    </div>
  )
}
