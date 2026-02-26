'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Upload, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ANTT_STAGES = [
  'Conectando à API da ANTT...',
  'Baixando arquivo de dados...',
  'Processando registros RNTRC...',
  'Salvando no banco de dados...',
  'Finalizando importação...',
]

function ProgressBar({
  value,
  indeterminate = false,
  label,
}: {
  value: number
  indeterminate?: boolean
  label?: string
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{label}</span>
          {!indeterminate && <span className="font-medium tabular-nums">{value}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        {indeterminate ? (
          <div
            className="h-full bg-indigo-500 rounded-full"
            style={{ animation: 'indeterminate 1.5s ease-in-out infinite', width: '40%' }}
          />
        ) : (
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${value}%` }}
          />
        )}
      </div>
    </div>
  )
}

export function RntrcUploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle')

  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchStageIndex, setFetchStageIndex] = useState(0)

  const [result, setResult] = useState<{
    success: boolean
    recordsImported: number
    errors: string[]
  } | null>(null)

  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.name.endsWith('.csv')) {
        toast.error('Apenas arquivos CSV são aceitos')
        return
      }
      if (f.size > 200 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 200MB.')
        return
      }
      setFile(f)
      setResult(null)
      setUploadProgress(0)
      setUploadStage('idle')
    }
  }, [])

  const handleUpload = () => {
    if (!file) {
      toast.error('Selecione um arquivo CSV')
      return
    }

    setLoading(true)
    setResult(null)
    setUploadProgress(0)
    setUploadStage('uploading')

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setUploadProgress(pct)
        if (pct === 100) setUploadStage('processing')
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText)
        setResult(data)
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          toast.success(`${data.recordsImported} registros importados com sucesso!`)
          router.refresh()
        } else {
          toast.error(data.error || `Falha na importação. ${data.errors?.length || 0} erros.`)
        }
      } catch {
        toast.error('Resposta inválida do servidor')
        setResult({ success: false, recordsImported: 0, errors: ['Resposta inválida do servidor'] })
      } finally {
        setLoading(false)
        setUploadStage('idle')
      }
    })

    xhr.addEventListener('error', () => {
      toast.error('Erro de rede ao enviar o arquivo')
      setResult({ success: false, recordsImported: 0, errors: ['Erro de rede ao enviar o arquivo'] })
      setLoading(false)
      setUploadStage('idle')
    })

    xhr.open('POST', '/api/admin/rntrc/upload')
    xhr.send(formData)
  }

  const handleFetchFromAntt = async () => {
    setFetchLoading(true)
    setFetchStageIndex(0)
    setResult(null)

    stageTimerRef.current = setInterval(() => {
      setFetchStageIndex((i) => Math.min(i + 1, ANTT_STAGES.length - 1))
    }, 8000)

    try {
      const res = await fetch('/api/admin/rntrc/fetch-from-antt', { method: 'POST' })
      let data: { success: boolean; recordsImported: number; errors: string[]; error?: string }
      try {
        data = await res.json()
      } catch {
        const errMsg = `Erro HTTP ${res.status}: ${res.statusText}`
        toast.error(errMsg)
        setResult({ success: false, recordsImported: 0, errors: [errMsg] })
        return
      }
      if (!res.ok) {
        const errMsg = data.error || `Erro HTTP ${res.status}`
        const allErrors = [errMsg, ...(data.errors ?? [])]
        setResult({ success: false, recordsImported: 0, errors: allErrors })
        toast.error(errMsg)
        return
      }
      setResult(data)
      if (data.success) {
        toast.success(`${data.recordsImported} registros importados da ANTT!`)
        router.refresh()
      } else {
        toast.error(`Falha na importação. ${data.errors?.[0] || 'Erro desconhecido'}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado'
      toast.error(msg)
      setResult({ success: false, recordsImported: 0, errors: [msg] })
    } finally {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
    }
  }, [])

  const isAnyLoading = loading || fetchLoading

  return (
    <>
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

      <div className="space-y-5">
        {/* Seletor de arquivo */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Arquivo CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isAnyLoading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
          />
          {file && !loading && (
            <p className="text-xs text-muted-foreground">
              {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}
        </div>

        {/* Progresso upload manual */}
        {loading && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
              <Upload className="h-4 w-4 animate-bounce" />
              {uploadStage === 'uploading'
                ? `Enviando arquivo... ${uploadProgress}%`
                : 'Processando registros no servidor...'}
            </div>
            {uploadStage === 'uploading' ? (
              <ProgressBar value={uploadProgress} label="Progresso do envio" />
            ) : (
              <ProgressBar value={100} indeterminate label="Processando no servidor..." />
            )}
          </div>
        )}

        {/* Progresso fetch ANTT */}
        {fetchLoading && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Download className="h-4 w-4 animate-pulse" />
              {ANTT_STAGES[fetchStageIndex]}
            </div>
            <ProgressBar value={0} indeterminate />
            <div className="flex gap-1.5">
              {ANTT_STAGES.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-700',
                    i <= fetchStageIndex ? 'bg-blue-400' : 'bg-blue-100'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleUpload} disabled={!file || isAnyLoading}>
            <Upload className="h-4 w-4 mr-2" />
            {loading ? 'Processando...' : 'Enviar e processar'}
          </Button>
          <Button variant="outline" onClick={handleFetchFromAntt} disabled={isAnyLoading}>
            <Download className="mr-2 h-4 w-4" />
            {fetchLoading ? 'Importando da ANTT...' : 'Baixar da ANTT via API'}
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={cn(
            'rounded-xl border p-4 space-y-2',
            result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          )}>
            <div className="flex items-center gap-2 font-medium">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-green-700">
                    {result.recordsImported.toLocaleString('pt-BR')} registros importados com sucesso
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span className="text-red-700">Falha na importação</span>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-0.5 border-t border-slate-200 pt-2 pl-1">
                {result.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
