'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ResumeButton({ resumePath }: { resumePath: string }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUrl = async () => {
      const supabase = createClient()
      // Пробуем signed URL (работает для приватных bucket)
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resumePath, 3600) // 1 час

      if (data?.signedUrl) {
        setUrl(data.signedUrl)
      } else {
        // Fallback: public URL (если bucket публичный)
        const { data: pub } = supabase.storage.from('resumes').getPublicUrl(resumePath)
        setUrl(pub.publicUrl)
      }
      setLoading(false)
    }
    getUrl()
  }, [resumePath])

  if (loading) return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-400 px-4 py-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Резюме...
    </span>
  )

  if (!url) return null

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
      <FileText className="w-4 h-4" /> Моё резюме (PDF)
    </a>
  )
}
