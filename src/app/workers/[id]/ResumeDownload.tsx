'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResumeDownload({ resumePath }: { resumePath: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUrl = async () => {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resumePath, 3600)

      if (data?.signedUrl) {
        setUrl(data.signedUrl)
      } else {
        const { data: pub } = supabase.storage.from('resumes').getPublicUrl(resumePath)
        setUrl(pub.publicUrl)
      }
      setLoading(false)
    }
    getUrl()
  }, [resumePath])

  if (loading) return <span className="inline-flex items-center gap-2 text-sm text-gray-400 mb-4"><Loader2 className="w-4 h-4 animate-spin" /> Загружаем...</span>
  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors mb-4">
      <FileText className="w-4 h-4" /> Скачать резюме (PDF)
    </a>
  )
}
