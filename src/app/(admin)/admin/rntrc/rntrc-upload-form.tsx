'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function RntrcUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    recordsImported: number
    errors: string[]
  } | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.name.endsWith('.csv')) {
        toast.error('Apenas arquivos CSV são aceitos')
        return
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 50MB.')
        return
      }
      setFile(f)
      setResult(null)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo CSV')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/rntrc/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro no upload')
      }

      setResult(data)

      if (data.success) {
        toast.success(`${data.recordsImported} registros importados com sucesso!`)
      } else {
        toast.error(`Falha na importação. ${data.errors?.length || 0} erros.`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado'
      toast.error(msg)
      setResult({ success: false, recordsImported: 0, errors: [msg] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Arquivo CSV</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <Button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Processando...' : 'Enviar e processar'}
      </Button>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <p className="font-medium">
            {result.success ? (
              <span className="text-green-700">
                {result.recordsImported} registros importados
              </span>
            ) : (
              <span className="text-red-700">Falha na importação</span>
            )}
          </p>
          {result.errors.length > 0 && (
            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
