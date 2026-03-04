'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle2, Loader2, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ProofUploadProps {
  freightId: string
  existingCount: number
}

export function ProofUpload({ freightId, existingCount }: ProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [count, setCount] = useState(existingCount)

  const handleFile = async (file: File) => {
    if (count >= 5) {
      toast.error('Limite de 5 comprovantes por frete atingido')
      return
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Formato não permitido. Use JPG, PNG, WebP ou PDF.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`/api/freights/${freightId}/proof`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao enviar comprovante')
        return
      }

      setCount(json.totalProofs)
      toast.success('Comprovante enviado! Frete marcado como Entregue.')
    } catch {
      toast.error('Erro ao enviar comprovante')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (count > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {count} comprovante{count > 1 ? 's' : ''} enviado{count > 1 ? 's' : ''}
        {count < 5 && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="ml-1 text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            + adicionar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
        />
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="h-7 text-xs border-brand-200 text-brand-700 hover:bg-brand-50 gap-1.5"
      >
        {uploading ? (
          <><Loader2 className="h-3 w-3 animate-spin" />Enviando…</>
        ) : (
          <><FileImage className="h-3 w-3" /><Upload className="h-3 w-3" />Comprovante de entrega</>
        )}
      </Button>
    </div>
  )
}
