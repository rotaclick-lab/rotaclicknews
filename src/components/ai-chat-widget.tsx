'use client'

import { useState } from 'react'
import { Bot, X, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface WizardData {
  name: string
  email: string
  phone: string
  originCep: string
  destCep: string
  weight: string
  invoiceValue: string
}

interface AiChatWidgetProps {
  onFillForm: (data: {
    name: string; email: string; phone: string
    originCep: string; destCep: string; weight: number; invoiceValue: number
    quantity?: number
  }) => void
  inline?: boolean
}

const STEPS = [
  { field: 'name' as keyof WizardData, label: 'Nome completo', placeholder: 'Ex: João da Silva', type: 'text', hint: 'Nome e sobrenome' },
  { field: 'email' as keyof WizardData, label: 'E-mail', placeholder: 'email@exemplo.com', type: 'email', hint: '' },
  { field: 'phone' as keyof WizardData, label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999', type: 'tel', hint: 'Com DDD' },
  { field: 'originCep' as keyof WizardData, label: 'CEP de Origem', placeholder: '00000-000', type: 'text', hint: '' },
  { field: 'destCep' as keyof WizardData, label: 'CEP de Destino', placeholder: '00000-000', type: 'text', hint: '' },
  { field: 'weight' as keyof WizardData, label: 'Peso da carga (kg)', placeholder: 'Ex: 10.5', type: 'text', hint: 'Peso total em kg' },
  { field: 'invoiceValue' as keyof WizardData, label: 'Valor da Nota Fiscal (R$)', placeholder: 'Ex: 1500,00', type: 'text', hint: 'Valor total da NF' },
]

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

function maskCurrency(v: string) {
  const d = v.replace(/\D/g, '')
  if (!d) return ''
  const n = Number(d) / 100
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function applyMask(field: keyof WizardData, v: string): string {
  if (field === 'phone') return maskPhone(v)
  if (field === 'originCep' || field === 'destCep') return maskCEP(v)
  if (field === 'invoiceValue') return maskCurrency(v)
  return v
}

function validate(field: keyof WizardData, value: string): string {
  const v = value.trim()
  if (!v) return 'Campo obrigatório'
  if (field === 'name' && v.split(' ').filter(Boolean).length < 2) return 'Informe nome e sobrenome'
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido'
  if (field === 'phone' && v.replace(/\D/g, '').length < 10) return 'Telefone inválido — mínimo 10 dígitos com DDD'
  if ((field === 'originCep' || field === 'destCep') && v.replace(/\D/g, '').length !== 8) return 'CEP deve ter 8 dígitos'
  if (field === 'weight' && (isNaN(Number(v.replace(',', '.'))) || Number(v.replace(',', '.')) <= 0)) return 'Peso inválido'
  if (field === 'invoiceValue' && Number(v.replace(/\./g, '').replace(',', '.')) <= 0) return 'Valor inválido'
  return ''
}

const EMPTY: WizardData = { name: '', email: '', phone: '', originCep: '', destCep: '', weight: '', invoiceValue: '' }

export function AiChatWidget({ onFillForm, inline = false }: AiChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(EMPTY)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const current = STEPS[step]!

  const handleChange = (v: string) => {
    setError('')
    setData((prev) => ({ ...prev, [current.field]: applyMask(current.field, v) }))
  }

  const handleNext = () => {
    const err = validate(current.field, data[current.field])
    if (err) { setError(err); return }
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      setError('')
    } else {
      const raw = data.invoiceValue.replace(/\./g, '').replace(',', '.')
      onFillForm({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone,
        originCep: data.originCep.replace(/\D/g, ''),
        destCep: data.destCep.replace(/\D/g, ''),
        weight: Number(data.weight.replace(',', '.')),
        invoiceValue: Number(raw),
        quantity: 1,
      })
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setStep(0); setData(EMPTY) }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleNext() }
  }

  const panel = open ? (
    <div className={cn(
      'flex flex-col rounded-2xl shadow-2xl border border-orange-100 bg-white overflow-hidden animate-in fade-in duration-200',
      inline
        ? 'absolute bottom-full left-0 mb-2 w-[340px] max-w-[calc(100vw-2rem)] z-50'
        : 'fixed bottom-20 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Cotar com IA</p>
          {!done && <p className="text-xs text-orange-100">Passo {step + 1} de {STEPS.length}</p>}
        </div>
        <button onClick={() => setOpen(false)} className="text-orange-100 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="h-1 bg-orange-100">
        <div
          className="h-1 bg-orange-500 transition-all duration-300"
          style={{ width: `${((step + (done ? 1 : 0)) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="p-5">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold text-gray-800">Preenchendo o formulário...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-gray-700">{current.label}</Label>
              {current.hint && <p className="text-xs text-gray-400 mt-0.5">{current.hint}</p>}
            </div>
            <Input
              autoFocus
              type={current.type}
              value={data[current.field]}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={current.placeholder}
              className={cn('text-sm', error ? 'border-red-400 focus-visible:ring-red-400' : 'focus-visible:ring-orange-400')}
              inputMode={
                current.field === 'phone' ? 'tel' :
                current.field === 'originCep' || current.field === 'destCep' ? 'numeric' :
                current.field === 'weight' || current.field === 'invoiceValue' ? 'decimal' :
                current.field === 'email' ? 'email' : 'text'
              }
            />
            {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { if (step > 0) { setStep(step - 1); setError('') } }}
                className={cn('flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600', step === 0 && 'invisible')}
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {step === STEPS.length - 1 ? 'Preencher' : 'Próximo'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null

  const trigger = (
    <button
      onClick={() => { setOpen((v) => !v); if (!open) { setStep(0); setData(EMPTY); setError(''); setDone(false) } }}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 shadow-md',
        open
          ? 'bg-gray-600 text-white hover:bg-gray-700'
          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105'
      )}
    >
      <Sparkles className="h-4 w-4" />
      Cotar com IA
    </button>
  )

  if (inline) {
    return (
      <div className="relative">
        {panel}
        {trigger}
      </div>
    )
  }

  return (
    <>
      {panel}
      <div className="fixed bottom-6 right-6 z-50">{trigger}</div>
    </>
  )
}
