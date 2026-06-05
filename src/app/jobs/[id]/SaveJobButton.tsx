'use client'

import { useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SaveJobButton({ jobId, initialSaved }: { jobId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const res = await fetch('/api/jobs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    })
    if (res.status === 401) {
      router.push('/auth/signin')
      return
    }
    const data = await res.json()
    if (data.saved !== undefined) setSaved(data.saved)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
        saved
          ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={`w-4 h-4 ${saved ? 'fill-blue-600 text-blue-600' : ''}`} />}
      {saved ? 'Сохранено' : 'Сохранить'}
    </button>
  )
}
