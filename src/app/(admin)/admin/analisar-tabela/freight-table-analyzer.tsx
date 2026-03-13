'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Upload, Sparkles, Loader2, CheckCircle2, TrendingUp, TrendingDown,
  Minus, Save, RotateCcw, ChevronLeft, AlertTriangle, Info,
  FileSpreadsheet, FileText, FileImage,
} from 'lucide-react'
import Link from 'next/link'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AnalyzingOverlay } from './analyzing-overlay'

interface Carrier {
  id: string
  name: string
  user_id: string | null
}

interface AnalyzedRow {
  origin_zip: string
  origin_zip_end: string | null
  dest_zip: string
  dest_zip_end: string | null
  origin_label: string
  dest_label: string
  price_per_kg: number | null
  min_price: number | null
  deadline_days: number
  weight_min: number | null
  weight_max: number | null
  market_avg_price: number | null
  suggested_markup_pct: number | null
  suggested_discount_pct: number | null
  market_comparison: string
}

interface EditableRow extends AnalyzedRow {
  applied_margin_pct: number
  margin_type: 'markup' | 'discount'
  final_price_per_kg: number | null
  final_min_price: number | null
  enabled: boolean
}

function calcFinalPrice(row: EditableRow): { price: number | null; min: number | null } {
  if (!row.price_per_kg) return { price: null, min: row.final_min_price }
  const pct = row.applied_margin_pct / 100
  const price = row.margin_type === 'markup'
    ? row.price_per_kg * (1 + pct)
    : row.price_per_kg * (1 - pct)
  const min = row.min_price
    ? row.margin_type === 'markup' ? row.min_price * (1 + pct) : row.min_price * (1 - pct)
    : null
  return { price: Math.round(price * 10000) / 10000, min: min ? Math.round(min * 100) / 100 : null }
}

function MarketBadge({ row }: { row: EditableRow }) {
  if (!row.market_avg_price || !row.price_per_kg) {
    return <span className="text-xs text-gray-400">sem dados</span>
  }
  const diff = ((row.price_per_kg - row.market_avg_price) / row.market_avg_price) * 100
  if (diff < -10) return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]"><TrendingDown className="h-3 w-3 mr-1" />{Math.abs(diff).toFixed(0)}% abaixo</Badge>
  if (diff > 10) return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]"><TrendingUp className="h-3 w-3 mr-1" />{diff.toFixed(0)}% acima</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]"><Minus className="h-3 w-3 mr-1" />na média</Badge>
}

export function FreightTableAnalyzer({ carriers }: { carriers: Carrier[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [carrierId, setCarrierId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<EditableRow[]>([])
  const [carrierName, setCarrierName] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  const [globalMargin, setGlobalMargin] = useState('')
  const [globalMarginType, setGlobalMarginType] = useState<'markup' | 'discount'>('markup')
  const [saved, setSaved] = useState(false)

  const selectedCarrier = carriers.find(c => c.id === carrierId)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setRows([])
    setSaved(false)
  }

  const handleAnalyze = async () => {
    if (!file) { toast.error('Selecione um arquivo'); return }
    if (!carrierId) { toast.error('Selecione a transportadora'); return }
    setAnalyzing(true)
    setSaved(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/freight-routes/analyze', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Erro ao analisar tabela')
        return
      }
      setCarrierName(json.carrier_name)
      setConfidence(json.confidence)
      setNotes(json.notes)
      const editable: EditableRow[] = (json.rows as AnalyzedRow[]).map(r => {
        const margin = r.suggested_markup_pct ?? 20
        const type: 'markup' | 'discount' = 'markup'
        const row: EditableRow = { ...r, applied_margin_pct: margin, margin_type: type, final_price_per_kg: null, final_min_price: null, enabled: true }
        const calc = calcFinalPrice(row)
        row.final_price_per_kg = calc.price
        row.final_min_price = calc.min
        return row
      })
      setRows(editable)
      toast.success(`${editable.length} faixas extraídas com sucesso!`)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setAnalyzing(false)
    }
  }

  const updateRow = (idx: number, changes: Partial<EditableRow>) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, ...changes }
      const calc = calcFinalPrice(updated)
      updated.final_price_per_kg = calc.price
      updated.final_min_price = calc.min
      return updated
    }))
  }

  const applyGlobalMargin = () => {
    const pct = parseFloat(globalMargin)
    if (isNaN(pct) || pct < 0) { toast.error('Informe uma margem válida'); return }
    setRows(prev => prev.map(r => {
      const updated = { ...r, applied_margin_pct: pct, margin_type: globalMarginType }
      const calc = calcFinalPrice(updated)
      updated.final_price_per_kg = calc.price
      updated.final_min_price = calc.min
      return updated
    }))
    toast.success(`Margem de ${pct}% aplicada em todas as linhas`)
  }

  const handleSave = async () => {
    if (!carrierId) { toast.error('Selecione a transportadora'); return }
    const enabledRows = rows.filter(r => r.enabled)
    if (!enabledRows.length) { toast.error('Nenhuma linha habilitada'); return }

    const carrier = carriers.find(c => c.id === carrierId)
    if (!carrier?.user_id) { toast.error('Transportadora sem usuário vinculado'); return }

    setSaving(true)
    try {
      const payload = enabledRows.map(r => ({
        carrier_id: carrier.user_id,
        origin_zip: r.origin_zip.replace(/\D/g, '').padEnd(8, '0'),
        origin_zip_end: r.origin_zip_end?.replace(/\D/g, '') || null,
        dest_zip: r.dest_zip.replace(/\D/g, '').padEnd(8, '0'),
        dest_zip_end: r.dest_zip_end?.replace(/\D/g, '') || null,
        cost_price_per_kg: r.price_per_kg,
        price_per_kg: r.final_price_per_kg,
        margin_percent: r.applied_margin_pct,
        cost_min_price: r.min_price,
        min_price: r.final_min_price ?? r.min_price ?? 0,
        deadline_days: r.deadline_days || 3,
        is_active: true,
        source_file: file?.name ?? null,
        rate_card: {
          origin_label: r.origin_label,
          dest_label: r.dest_label,
          weight_min: r.weight_min,
          weight_max: r.weight_max,
          market_avg_price: r.market_avg_price,
          margin_type: r.margin_type,
        },
      }))

      const res = await fetch('/api/admin/freight-routes/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier_id: carrier.user_id, rows: payload }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Erro ao salvar')
        return
      }
      toast.success(`${json.count} rotas salvas com sucesso!`)
      setSaved(true)
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setRows([])
    setCarrierName(null)
    setConfidence(null)
    setNotes(null)
    setSaved(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {analyzing && <AnalyzingOverlay filename={file?.name ?? 'tabela'} />}
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tabela-frete">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Analisador de Tabela de Frete com IA
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Envie a tabela do transportador — a IA extrai as faixas e sugere margens com base no mercado
          </p>
        </div>
      </div>

      {/* Upload + Carrier */}
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-orange-500" /> Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transportadora</Label>
              <Select value={carrierId} onValueChange={setCarrierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a transportadora..." />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {carrierId && !selectedCarrier?.user_id && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Transportadora sem usuário vinculado
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Arquivo da tabela</Label>
              <div
                className="border-2 border-dashed border-orange-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> {file.name}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-3 text-gray-300">
                      <FileSpreadsheet className="h-6 w-6" />
                      <FileText className="h-6 w-6" />
                      <FileImage className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-gray-400">Clique para selecionar ou arraste aqui</p>
                    <p className="text-xs text-gray-300">Excel · CSV · TXT · PDF · Imagem</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.tsv,.ods,image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !file || !carrierId}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {analyzing ? 'Analisando com IA...' : 'Analisar Tabela'}
            </Button>
            {rows.length > 0 && (
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Nova análise
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {rows.length > 0 && (
        <>
          {/* Info da análise */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={cn('text-xs', confidence === 'high' ? 'bg-green-100 text-green-700' : confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
              Confiança: {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
            <span className="text-sm text-gray-600">{rows.length} faixas extraídas</span>
            <span className="text-sm text-gray-600">{rows.filter(r => r.enabled).length} habilitadas</span>
            {carrierName && <span className="text-sm text-gray-500">Transportadora detectada: <strong>{carrierName}</strong></span>}
            {notes && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Info className="h-3 w-3" /> {notes}
              </span>
            )}
          </div>

          {/* Margem global */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-medium text-blue-900">Aplicar margem global:</p>
                <Select value={globalMarginType} onValueChange={(v) => setGlobalMarginType(v as 'markup' | 'discount')}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markup">Markup (adicionar %)</SelectItem>
                    <SelectItem value="discount">Desconto (reduzir %)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  placeholder="Ex: 20"
                  className="w-24 h-8 text-sm"
                  value={globalMargin}
                  onChange={(e) => setGlobalMargin(e.target.value)}
                />
                <span className="text-sm text-gray-500">%</span>
                <Button size="sm" variant="outline" onClick={applyGlobalMargin} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  Aplicar em todas
                </Button>
                <p className="text-xs text-gray-400 ml-auto">Ou ajuste linha a linha na tabela abaixo</p>
              </div>
            </CardContent>
          </Card>

          {/* Tabela editável */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Origem</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Destino</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Custo/kg</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Mín. custo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Mercado</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Margem %</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-orange-600 uppercase">Preço final/kg</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-orange-600 uppercase">Mín. final</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Prazo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className={cn('hover:bg-gray-50 transition-colors', !row.enabled && 'opacity-40')}>
                      <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-xs">{row.origin_label}</p>
                        <p className="text-[10px] text-gray-400">{row.origin_zip}{row.origin_zip_end ? `–${row.origin_zip_end}` : ''}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-xs">{row.dest_label}</p>
                        <p className="text-[10px] text-gray-400">{row.dest_zip}{row.dest_zip_end ? `–${row.dest_zip_end}` : ''}</p>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono">
                        {row.price_per_kg != null ? `R$ ${row.price_per_kg.toFixed(4)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono">
                        {row.min_price != null ? `R$ ${row.min_price.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <MarketBadge row={row} />
                          {row.market_avg_price && (
                            <span className="text-[10px] text-gray-400">avg R${row.market_avg_price.toFixed(4)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <select
                          className="text-[10px] border rounded px-1 py-0.5 bg-white"
                          value={row.margin_type}
                          onChange={(e) => updateRow(idx, { margin_type: e.target.value as 'markup' | 'discount' })}
                        >
                          <option value="markup">Markup</option>
                          <option value="discount">Desconto</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            className="w-16 h-7 text-xs text-center p-1"
                            value={row.applied_margin_pct}
                            onChange={(e) => updateRow(idx, { applied_margin_pct: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        {row.suggested_markup_pct != null && (
                          <p className="text-[10px] text-blue-500 mt-0.5">sugerido: {row.suggested_markup_pct}%</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn('text-xs font-bold font-mono', row.final_price_per_kg ? 'text-orange-600' : 'text-gray-400')}>
                          {row.final_price_per_kg != null ? `R$ ${row.final_price_per_kg.toFixed(4)}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn('text-xs font-bold font-mono', row.final_min_price ? 'text-orange-600' : 'text-gray-400')}>
                          {row.final_min_price != null ? `R$ ${row.final_min_price.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Input
                          type="number"
                          min={1}
                          className="w-14 h-7 text-xs text-center p-1"
                          value={row.deadline_days}
                          onChange={(e) => updateRow(idx, { deadline_days: parseInt(e.target.value) || 3 })}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => updateRow(idx, { enabled: e.target.checked })}
                          className="h-4 w-4 rounded accent-orange-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Ações finais */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {rows.filter(r => r.enabled).length} de {rows.length} faixas serão salvas para <strong>{selectedCarrier?.name}</strong>
            </p>
            <div className="flex gap-3">
              {saved && (
                <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Salvo com sucesso!
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || rows.filter(r => r.enabled).length === 0 || !selectedCarrier?.user_id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Salvando...' : `Salvar ${rows.filter(r => r.enabled).length} rotas`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
