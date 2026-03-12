'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface FormData {
  name: string
  email: string
  phone: string
  originCep: string
  destCep: string
  weight: number
  invoiceValue: number
}

interface AiChatWidgetProps {
  onFillForm: (data: FormData) => void
}

const WELCOME = 'Olá! Sou a Rota, assistente de cotação de frete da RotaClick. 👋\n\nPode me dizer seu **nome completo** para começarmos?'

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

type InputMode = 'text' | 'phone' | 'cep' | 'number' | 'currency' | 'email'

function detectInputMode(lastAssistantMsg: string): InputMode {
  const msg = lastAssistantMsg.toLowerCase()
  if (msg.includes('telefone') || msg.includes('whatsapp') || msg.includes('celular')) return 'phone'
  if (msg.includes('cep de origem')) return 'cep'
  if (msg.includes('cep de destino')) return 'cep'
  if (msg.includes('cep')) return 'cep'
  if (msg.includes('peso')) return 'number'
  if (msg.includes('valor') || msg.includes('nota fiscal') || msg.includes('nf')) return 'currency'
  if (msg.includes('e-mail') || msg.includes('email')) return 'email'
  return 'text'
}

function getPlaceholder(mode: InputMode): string {
  switch (mode) {
    case 'phone': return '(11) 99999-9999'
    case 'cep': return '00000-000'
    case 'number': return 'Ex: 10.5'
    case 'currency': return 'Ex: 1500,00'
    case 'email': return 'email@exemplo.com'
    default: return 'Digite sua resposta...'
  }
}

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

export function AiChatWidget({ onFillForm }: AiChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
  const inputMode: InputMode = done ? 'text' : detectInputMode(lastAssistantMsg)

  const handleInputChange = (v: string) => {
    switch (inputMode) {
      case 'phone': setInput(maskPhone(v)); break
      case 'cep': setInput(maskCEP(v)); break
      case 'currency': setInput(maskCurrency(v)); break
      default: setInput(v)
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [inputMode])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || done) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Desculpe, tive um problema técnico. Tente novamente.' },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])

      if (data.action?.type === 'fill_form' && data.action?.data) {
        setDone(true)
        setTimeout(() => {
          onFillForm(data.action.data as FormData)
          setOpen(false)
        }, 1800)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão. Verifique sua internet e tente novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([{ role: 'assistant', content: WELCOME }])
    setDone(false)
    setInput('')
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-semibold text-sm transition-all duration-300',
          open
            ? 'bg-gray-700 text-white'
            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105'
        )}
        aria-label="Assistente de cotação IA"
      >
        {open ? (
          <><X className="h-4 w-4" /> Fechar</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Cotar com IA</>
        )}
      </button>

      {/* Janela do chat */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-orange-100 bg-white overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Rota — Assistente IA</p>
              <p className="text-xs text-orange-100">Cotação inteligente de frete</p>
            </div>
            {done && (
              <button onClick={handleReset} className="text-xs underline text-orange-100 hover:text-white">
                Reiniciar
              </button>
            )}
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] min-h-[200px] bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center mb-1">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div
                      className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-gray-100 text-sm text-gray-800 shadow-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-orange-500 text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-100 bg-white">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={done ? 'Preenchendo formulário...' : getPlaceholder(inputMode)}
              disabled={loading || done}
              inputMode={inputMode === 'phone' || inputMode === 'cep' || inputMode === 'number' || inputMode === 'currency' ? 'numeric' : 'text'}
              className="flex-1 text-sm border-gray-200 focus-visible:ring-orange-400"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || done}
              className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
