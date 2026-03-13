'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Power, PowerOff, Sparkles } from 'lucide-react'
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
import Link from 'next/link'
import {
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
  const [editRoute, setEditRoute] = useState<Route | null>(null)
  const [deleteRoute, setDeleteRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(false)

  // Ler carrierId da URL atual em vez da prop
  const currentCarrierId = searchParams.get('carrier') || undefined

  const handleCarrierFilter = (carrierId: string) => {
    const params = new URLSearchParams()
    if (carrierId) params.set('carrier', carrierId)
    params.set('page', '1')
    router.push(`/admin/tabela-frete?${params.toString()}`)
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
            onValueChange={(v) => handleCarrierFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todas transportadoras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas transportadoras</SelectItem>
              {carriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/analisar-tabela">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            Adicionar tabela com IA
          </Button>
        </Link>
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
            <TableHead className="w-[100px]">Ações</TableHead>
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
                <Button variant="ghost" size="sm" className="h-auto py-1" onClick={() => handleToggleActive(r)} title={r.is_active !== false ? 'Desativar' : 'Ativar'}>
                  {r.is_active !== false ? (
                    <span className="text-green-600 font-medium flex items-center gap-1"><Power className="h-3 w-3" /> Ativa</span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1"><PowerOff className="h-3 w-3" /> Inativa</span>
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditRoute(r)}>
                    <Pencil className="h-4 w-4" />
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
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-muted-foreground">Nenhuma rota cadastrada para esta transportadora.</p>
          <Link href="/admin/analisar-tabela">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              <Sparkles className="h-4 w-4 mr-2" /> Adicionar tabela com IA
            </Button>
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(currentPage - 1)); router.push(`/admin/tabela-frete?${p.toString()}`) }}>
                Anterior
              </Button>
            )}
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(currentPage + 1)); router.push(`/admin/tabela-frete?${p.toString()}`) }}>
                Próxima
              </Button>
            )}
          </div>
        </div>
      )}

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
