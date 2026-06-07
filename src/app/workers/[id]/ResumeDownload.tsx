'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResumeDownload({ resumePath }: { resumePath: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const { data } = createClient().storage.from('resumes').getPublicUrl(resumePath)
    setUrl(data.publicUrl)
  }, [resumePath])

  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors mb-4">
      <FileText className="w-4 h-4" /> Скачать резюме (PDF)
    </a>
  )
}
