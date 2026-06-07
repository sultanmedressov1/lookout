'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bucket: string
  path: string          // e.g. "companies/abc123/logo"
  accept: string        // e.g. "image/*" or ".pdf"
  currentUrl?: string
  onUploaded: (url: string) => void
  label?: string
  maxMB?: number
}

export function FileUpload({ bucket, path, accept, currentUrl, onUploaded, label = 'Загрузить файл', maxMB = 5 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Файл слишком большой (максимум ${maxMB} МБ)`)
      return
    }

    setUploading(true)
    setError('')
    setDone(false)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `${path}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })

      if (uploadError) { setError(uploadError.message); return }

      if (bucket === 'avatars') {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
        onUploaded(data.publicUrl)
      } else {
        onUploaded(filePath)
      }
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
          done ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
        }`}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Загружаем...' : done ? 'Загружено!' : label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
