'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResumeButton({ resumePath }: { resumePath: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const { data } = createClient().storage.from('resumes').getPublicUrl(resumePath)
    setUrl(data.publicUrl)
  }, [resumePath])

  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
      <FileText className="w-4 h-4" /> Моё резюме (PDF)
    </a>
  )
}
