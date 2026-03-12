'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Eye, EyeOff, RotateCcw, Mail, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface EmailTemplate {
  id: string
  label: string
  subject: string
  html: string
  variables: string[]
  updated_at: string
}

const SAMPLE_VARS: Record<string, string> = {
  name: 'João da Silva',
  carrierName: 'Transportadora Exemplo Ltda',
  originZip: '01310-100',
  destZip: '30130-110',
  prazo: '3 dias úteis',
  price: 'R$ 350,00',
  peso: '25.0 kg',
  companyName: 'Transportadora Exemplo Ltda',
  reason: 'Documentação incompleta — RNTRC não encontrado na base da ANTT.',
}

function applyVars(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (h, [k, v]) => h.replaceAll(`{{${k}}}`, v),
    html
  )
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editHtml, setEditHtml] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/admin/email-templates')
      .then((r) => r.json())
      .then(({ data }) => {
        setTemplates(data ?? [])
        if (data?.[0]) {
          select(data[0])
        }
        setLoading(false)
      })
  }, [])

  function select(t: EmailTemplate) {
    setSelected(t)
    setEditSubject(t.subject)
    setEditHtml(t.html)
    setDirty(false)
    setStatus('idle')
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setStatus('idle')
    const res = await fetch('/api/admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, subject: editSubject, html: editHtml }),
    })
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => t.id === selected.id ? { ...t, subject: editSubject, html: editHtml } : t)
      )
      setSelected((prev) => prev ? { ...prev, subject: editSubject, html: editHtml } : prev)
      setStatus('saved')
      setDirty(false)
    } else {
      setStatus('error')
    }
    setSaving(false)
    setTimeout(() => setStatus('idle'), 3000)
  }

  const handleReset = () => {
    if (!selected) return
    setEditSubject(selected.subject)
    setEditHtml(selected.html)
    setDirty(false)
  }

  const previewHtml = selected ? applyVars(editHtml, SAMPLE_VARS) : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-orange-500" />
            Templates de E-mail
          </h1>
          <p className="text-sm text-slate-500 mt-1">Edite o conteúdo e layout dos e-mails transacionais</p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Salvo
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
              <AlertCircle className="h-4 w-4" /> Erro ao salvar
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty}>
            <RotateCcw className="h-4 w-4 mr-1" /> Resetar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Lista de templates */}
        <div className="w-56 shrink-0 space-y-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (dirty && !confirm('Há alterações não salvas. Deseja descartar?')) return
                select(t)
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                selected?.id === t.id
                  ? 'bg-orange-500 text-white font-medium'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editor + Preview */}
        {selected && (
          <div className={cn('flex-1 flex gap-4 min-w-0', showPreview ? 'flex-row' : 'flex-col')}>
            {/* Editor */}
            <div className={cn('flex flex-col gap-3', showPreview ? 'w-1/2' : 'w-full')}>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex-shrink-0">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assunto</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => { setEditSubject(e.target.value); setDirty(true) }}
                    className="mt-1 text-sm"
                    placeholder="Assunto do e-mail"
                  />
                </div>
                {selected.variables.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variáveis disponíveis</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.variables.map((v) => (
                        <code
                          key={v}
                          className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded cursor-pointer hover:bg-orange-100"
                          onClick={() => {
                            setEditHtml((prev) => prev + `{{${v}}}`)
                            setDirty(true)
                          }}
                          title="Clique para inserir no HTML"
                        >
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Clique para inserir no final do HTML</p>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">HTML</span>
                  <span className="text-xs text-slate-400">{editHtml.length} chars</span>
                </div>
                <textarea
                  value={editHtml}
                  onChange={(e) => { setEditHtml(e.target.value); setDirty(true) }}
                  className="flex-1 p-4 text-xs font-mono text-slate-700 resize-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</span>
                  <span className="text-xs text-slate-400 ml-auto">Dados de exemplo</span>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  className="flex-1 w-full border-none"
                  title="Preview do e-mail"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
