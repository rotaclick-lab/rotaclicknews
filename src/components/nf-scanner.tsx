'use client'

import { useRef, useState } from 'react'
import { Sparkles, Upload, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NfData {
  weight: number | null
  invoiceValue: number | null
  quantity: number | null
  confidence: string
  notes?: string
}

interface NfScannerProps {
  onExtracted: (data: NfData) => void
}

export function NfScanner({ onExtracted }: NfScannerProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<NfData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Envie uma imagem (JPG, PNG) ou PDF da nota fiscal.')
      setState('error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setState('loading')
    setErrorMsg('')
    setResult(null)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/ai/read-nf', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Não foi possível ler a nota fiscal.')
        setState('error')
        return
      }

      setResult(data.data)
      setState('success')
      onExtracted(data.data)
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
      setState('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setState('idle')
    setPreview(null)
    setResult(null)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium text-gray-700">Preencher com IA — foto da NF</span>
        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Novo</span>
      </div>

      {state === 'idle' && (
        <div
          className="border-2 border-dashed border-orange-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-200 group"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="h-7 w-7 text-orange-300 group-hover:text-orange-500 mx-auto mb-2 transition-colors" />
          <p className="text-sm text-gray-500 group-hover:text-gray-700">
            <span className="font-medium text-orange-500">Clique</span> ou arraste a foto da NF
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG ou PDF • máx 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {state === 'loading' && (
        <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50/30">
          {preview && (
            <img src={preview} alt="NF" className="w-full max-h-32 object-contain rounded-lg mb-3 opacity-60" />
          )}
          <div className="flex items-center justify-center gap-3 text-orange-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">IA lendo sua nota fiscal...</span>
          </div>
        </div>
      )}

      {state === 'success' && result && (
        <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Dados extraídos com sucesso!</span>
            </div>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className={cn('rounded-lg p-2', result.weight != null ? 'bg-white border border-green-100' : 'bg-gray-50 border border-gray-100')}>
              <p className="text-[10px] text-gray-500 uppercase">Peso</p>
              <p className={cn('text-sm font-bold', result.weight != null ? 'text-green-700' : 'text-gray-400')}>
                {result.weight != null ? `${result.weight} kg` : '—'}
              </p>
            </div>
            <div className={cn('rounded-lg p-2', result.invoiceValue != null ? 'bg-white border border-green-100' : 'bg-gray-50 border border-gray-100')}>
              <p className="text-[10px] text-gray-500 uppercase">Valor NF</p>
              <p className={cn('text-sm font-bold', result.invoiceValue != null ? 'text-green-700' : 'text-gray-400')}>
                {result.invoiceValue != null
                  ? result.invoiceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '—'}
              </p>
            </div>
            <div className={cn('rounded-lg p-2', result.quantity != null ? 'bg-white border border-green-100' : 'bg-gray-50 border border-gray-100')}>
              <p className="text-[10px] text-gray-500 uppercase">Volumes</p>
              <p className={cn('text-sm font-bold', result.quantity != null ? 'text-green-700' : 'text-gray-400')}>
                {result.quantity != null ? result.quantity : '—'}
              </p>
            </div>
          </div>
          {result.confidence === 'low' && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Confiança baixa — verifique os valores preenchidos.
            </p>
          )}
          <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Enviar outra imagem
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50/40 space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="border-red-200 text-red-600 hover:bg-red-50">
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}
