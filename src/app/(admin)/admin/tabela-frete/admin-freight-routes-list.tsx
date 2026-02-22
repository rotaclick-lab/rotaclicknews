'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Power, PowerOff, Upload, FileSpreadsheet } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useRef } from 'react'
import {
  createAdminFreightRoute,
  updateAdminFreightRoute,
  deleteAdminFreightRoute,
  toggleAdminFreightRouteActive,
} from '@/app/actions/admin-actions'

interface Route {
  id: string
  carrier_id: string
  origin_zip: string
  dest_zip: string
  origin_zip_end?: string | null
  dest_zip_end?: string | null
  price_per_kg: number
  min_price: number
  deadline_days: number
  is_active?: boolean | null
  created_at: string
  carrierName?: string
}

interface CarrierOption {
  id: string
  label: string
}

export function AdminFreightRoutesList({
  routes,
  total,
  currentPage,
  carriers,
  selectedCarrierId,
}: {
  routes: Route[]
  total: number
  currentPage: number
  carriers: CarrierOption[]
  selectedCarrierId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editRoute, setEditRoute] = useState<Route | null>(null)
  const [deleteRoute, setDeleteRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Ler carrierId da URL atual em vez da prop
  const currentCarrierId = searchParams.get('carrier') || undefined
  const [createCarrierId, setCreateCarrierId] = useState(currentCarrierId || '')
  const [importOpen, setImportOpen] = useState(false)
  const [importCarrierId, setImportCarrierId] = useState(currentCarrierId || '')
  const [importMargin, setImportMargin] = useState('20')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug: verificar se carriers está carregando
  console.log('Debug - carriers:', carriers)
  console.log('Debug - selectedCarrierId (prop):', selectedCarrierId)
  console.log('Debug - currentCarrierId (URL):', currentCarrierId)

  // Map carrier_id to company_id for import button
  const carrierIdToCompanyId = new Map(
    routes.map(r => [r.carrier_id, carriers.find(c => c.id === selectedCarrierId)?.id || ''])
  )

  const handleBulkImport = async () => {
    if (!importCarrierId) { toast.error('Selecione uma transportadora'); return }
    if (!importFile) { toast.error('Selecione um arquivo Excel'); return }
    setImporting(true)
    const fd = new FormData()
    fd.append('file', importFile)
    fd.append('carrier_id', importCarrierId)
    fd.append('margin_percent', importMargin)
    try {
      const res = await fetch('/api/admin/freight-routes/import', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        toast.success(`${json.data.imported_count} rotas importadas com margem de ${importMargin}%!`)
        if (json.data.errors?.length > 0) toast.warning(`${json.data.errors.length} linha(s) com erro ignoradas`)
        setImportOpen(false)
        setImportFile(null)
        router.refresh()
      } else {
        toast.error(json.error || 'Erro ao importar')
      }
    } catch {
      toast.error('Erro inesperado ao importar')
    }
    setImporting(false)
  }

  const handleCarrierFilter = (carrierId: string) => {
    console.log('handleCarrierFilter called with:', carrierId)
    const params = new URLSearchParams()
    if (carrierId) params.set('carrier', carrierId)
    params.set('page', '1')
    router.push(`/admin/tabela-frete?${params.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const carrier_id = (form.elements.namedItem('carrier_id') as HTMLSelectElement)?.value
    const origin_zip = (form.elements.namedItem('origin_zip') as HTMLInputElement)?.value
    const dest_zip = (form.elements.namedItem('dest_zip') as HTMLInputElement)?.value
    const cost_price_per_kg = (form.elements.namedItem('cost_price_per_kg') as HTMLInputElement)?.value
    const margin_percent = (form.elements.namedItem('margin_percent') as HTMLInputElement)?.value
    const cost_min_price = (form.elements.namedItem('cost_min_price') as HTMLInputElement)?.value
    const deadline_days = (form.elements.namedItem('deadline_days') as HTMLInputElement)?.value
    if (!carrier_id || !origin_zip || !dest_zip) {
      toast.error('Preencha transportadora, origem e destino')
      return
    }
    if (!cost_price_per_kg || Number(cost_price_per_kg) <= 0) {
      toast.error('Informe o custo por kg (preço do transportador)')
      return
    }
    setLoading(true)
    const res = await createAdminFreightRoute({
      carrier_id,
      origin_zip,
      dest_zip,
      cost_price_per_kg: Number(cost_price_per_kg),
      margin_percent: Number(margin_percent) || 0,
      min_price: Number(cost_min_price) || 0,
      cost_min_price: Number(cost_min_price) || 0,
      deadline_days: Number(deadline_days) || 1,
    })
    setLoading(false)
    if (res.success) {
      toast.success('Rota criada com margem aplicada!')
      setCreateOpen(false)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editRoute) return
    const form = e.currentTarget
    const origin_zip = (form.elements.namedItem('edit_origin_zip') as HTMLInputElement)?.value
    const dest_zip = (form.elements.namedItem('edit_dest_zip') as HTMLInputElement)?.value
    const price_per_kg = (form.elements.namedItem('edit_price_per_kg') as HTMLInputElement)?.value
    const min_price = (form.elements.namedItem('edit_min_price') as HTMLInputElement)?.value
    const deadline_days = (form.elements.namedItem('edit_deadline_days') as HTMLInputElement)?.value
    setLoading(true)
    const res = await updateAdminFreightRoute(editRoute.id, {
      origin_zip,
      dest_zip,
      price_per_kg: Number(price_per_kg),
      min_price: Number(min_price),
      deadline_days: Number(deadline_days),
    })
    setLoading(false)
    if (res.success) {
      toast.success('Rota atualizada')
      setEditRoute(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleToggleActive = async (r: Route) => {
    const res = await toggleAdminFreightRouteActive(r.id)
    if (res.success) {
      toast.success(res.is_active ? 'Rota ativada' : 'Rota desativada')
      router.refresh()
    } else toast.error(res.error)
  }

  const handleDelete = async () => {
    if (!deleteRoute) return
    setLoading(true)
    const res = await deleteAdminFreightRoute(deleteRoute.id)
    setLoading(false)
    if (res.success) {
      toast.success('Rota excluída')
      setDeleteRoute(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const formatCep = (v: string) => {
    const d = (v || '').replace(/\D/g, '')
    if (d.length === 8) return `${d.slice(0, 5)}-${d.slice(5)}`
    return v || '-'
  }

  const perPage = 50
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select
            value={currentCarrierId || 'all'}
            onValueChange={(v) => {
              console.log('Select onValueChange:', v)
              handleCarrierFilter(v === 'all' ? '' : v)
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todas transportadoras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas transportadoras</SelectItem>
              {carriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setCreateOpen(true); setCreateCarrierId(selectedCarrierId || ''); }} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova rota
          </Button>
          <Button
            onClick={() => { setImportOpen(true); setImportCarrierId(selectedCarrierId || '') }}
            size="sm"
            variant="outline"
            className="border-brand-300 text-brand-700 hover:bg-brand-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transportadora</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Custo/kg</TableHead>
            <TableHead>Publicado/kg</TableHead>
            <TableHead>Margem</TableHead>
            <TableHead>Mínimo pub.</TableHead>
            <TableHead>Prazo (dias)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.carrierName || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{formatCep(r.origin_zip)}</TableCell>
              <TableCell className="font-mono text-sm">{formatCep(r.dest_zip)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{(r as any).cost_price_per_kg != null ? `R$ ${Number((r as any).cost_price_per_kg).toFixed(4)}` : '—'}</TableCell>
              <TableCell className="font-medium text-brand-700">R$ {Number(r.price_per_kg).toFixed(4)}</TableCell>
              <TableCell>{(r as any).margin_percent != null ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{Number((r as any).margin_percent).toFixed(1)}%</span> : '—'}</TableCell>
              <TableCell>R$ {Number(r.min_price).toFixed(2)}</TableCell>
              <TableCell>{r.deadline_days}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1"
                  onClick={() => handleToggleActive(r)}
                  title={r.is_active !== false ? 'Desativar' : 'Ativar'}
                >
                  {r.is_active !== false ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Power className="h-3 w-3" /> Ativa
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <PowerOff className="h-3 w-3" /> Inativa
                    </span>
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRoute(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-blue-600" 
                    onClick={() => { 
                      setImportOpen(true); 
                      // Find the company_id for this carrier
                      const routeCompanyId = carriers.find(c => c.id === selectedCarrierId)?.id || ''
                      setImportCarrierId(routeCompanyId); 
                    }}
                    title="Importar tabela de frete"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteRoute(r)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {routes.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma rota encontrada. Crie uma nova rota ou selecione outra transportadora.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(currentPage - 1))
                  router.push(`/admin/tabela-frete?${params.toString()}`)
                }}
              >
                Anterior
              </Button>
            )}
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(currentPage + 1))
                  router.push(`/admin/tabela-frete?${params.toString()}`)
                }}
              >
                Próxima
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-600" />
              Importar tabela de frete em lote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              A margem será aplicada automaticamente sobre todos os preços do arquivo. O cliente verá o preço com margem; o transportador recebe o custo original.
            </div>
            <div>
              <Label>Transportadora *</Label>
              <select
                className="w-full h-10 rounded-md border px-3 mt-1"
                value={importCarrierId}
                onChange={e => setImportCarrierId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Margem RotaClick (%)</Label>
              <Input
                type="number"
                min="0"
                max="200"
                step="0.1"
                value={importMargin}
                onChange={e => setImportMargin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Arquivo Excel (.xlsx / .xls)</Label>
              <div
                className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {importFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-brand-700 font-medium">
                    <FileSpreadsheet className="h-5 w-5" />
                    {importFile.name}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                    Clique para selecionar o arquivo
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null) }} disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={handleBulkImport} disabled={importing || !importFile || !importCarrierId}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importando...' : `Importar com ${importMargin}% margem`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova rota de frete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Transportadora *</Label>
              <select
                name="carrier_id"
                className="w-full h-10 rounded-md border px-3"
                required
                defaultValue={createCarrierId || (carriers[0]?.id ?? '')}
              >
                <option value="">Selecione...</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>CEP Origem *</Label>
              <Input name="origin_zip" placeholder="00000-000" required />
            </div>
            <div>
              <Label>CEP Destino *</Label>
              <Input name="dest_zip" placeholder="00000-000" required />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Custo</strong> = preço do transportador. <strong>Margem</strong> = % que a RotaClick adiciona. O cliente vê o preço publicado (custo + margem).
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Custo R$/kg (transportador) *</Label>
                <Input name="cost_price_per_kg" type="number" step="0.0001" min="0" defaultValue="0" required />
              </div>
              <div>
                <Label>Margem RotaClick (%)</Label>
                <Input name="margin_percent" type="number" step="0.1" min="0" max="200" defaultValue="20" />
              </div>
            </div>
            <div>
              <Label>Custo mínimo (R$) — do transportador</Label>
              <Input name="cost_min_price" type="number" step="0.01" defaultValue="0" />
            </div>
            <div>
              <Label>Prazo (dias úteis)</Label>
              <Input name="deadline_days" type="number" min="1" defaultValue="1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar rota'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRoute} onOpenChange={(o) => !o && setEditRoute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rota</DialogTitle>
          </DialogHeader>
          {editRoute && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>CEP Origem</Label>
                <Input name="edit_origin_zip" defaultValue={formatCep(editRoute.origin_zip)} required />
              </div>
              <div>
                <Label>CEP Destino</Label>
                <Input name="edit_dest_zip" defaultValue={formatCep(editRoute.dest_zip)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>R$/kg</Label>
                  <Input name="edit_price_per_kg" type="number" step="0.01" defaultValue={editRoute.price_per_kg} />
                </div>
                <div>
                  <Label>Valor mínimo (R$)</Label>
                  <Input name="edit_min_price" type="number" step="0.01" defaultValue={editRoute.min_price} />
                </div>
              </div>
              <div>
                <Label>Prazo (dias úteis)</Label>
                <Input name="edit_deadline_days" type="number" min="1" defaultValue={editRoute.deadline_days} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditRoute(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteRoute} onOpenChange={(o) => !o && setDeleteRoute(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rota?</AlertDialogTitle>
            <AlertDialogDescription>
              A rota {deleteRoute && `${formatCep(deleteRoute.origin_zip)} → ${formatCep(deleteRoute.dest_zip)}`} será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
