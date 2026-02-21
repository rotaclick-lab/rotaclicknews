'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Pencil, Trash2, Table2 } from 'lucide-react'
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
import { toast } from 'sonner'
import {
  createAdminCarrier,
  updateAdminCarrier,
  deleteAdminCarrier,
  listAdminUsersForCarrierCreation,
  listAdminCompanies,
} from '@/app/actions/admin-actions'

interface Carrier {
  id: string
  user_id: string
  rntrc: string | null
  rntrc_status: string | null
  company_name: string | null
  created_at: string
  companyName?: string | null
  document?: string | null
}

export function AdminCarriersList({
  carriers,
  total,
  currentPage,
}: {
  carriers: Carrier[]
  total: number
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCarrier, setEditCarrier] = useState<Carrier | null>(null)
  const [deleteCarrier, setDeleteCarrier] = useState<Carrier | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; hasCarrier?: boolean }>>([])
  const [companies, setCompanies] = useState<Array<{ id: string; nome_fantasia: string; razao_social: string }>>([])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/transportadoras?${params.toString()}`)
  }

  const openCreate = async () => {
    setCreateOpen(true)
    const [usersList, cRes] = await Promise.all([
      listAdminUsersForCarrierCreation(),
      listAdminCompanies({ page: 1, perPage: 500 }),
    ])
    setUsers(
      usersList.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        hasCarrier: u.hasCarrier,
      }))
    )
    if (cRes.success && cRes.data) {
      setCompanies(
        cRes.data.companies.map((c) => ({
          id: c.id,
          nome_fantasia: c.nome_fantasia || c.razao_social || c.name || '-',
          razao_social: c.razao_social || c.name || '-',
        }))
      )
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const user_id = (form.elements.namedItem('user_id') as HTMLSelectElement)?.value
    const company_id = (form.elements.namedItem('company_id') as HTMLSelectElement)?.value
    const rntrc = (form.elements.namedItem('rntrc') as HTMLInputElement)?.value
    if (!user_id || !company_id) {
      toast.error('Selecione usuário e empresa')
      return
    }
    setLoading(true)
    const res = await createAdminCarrier({ user_id, company_id, rntrc: rntrc || undefined })
    setLoading(false)
    if (res.success) {
      toast.success('Transportadora criada')
      setCreateOpen(false)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editCarrier) return
    const form = e.currentTarget
    const rntrc = (form.elements.namedItem('edit_rntrc') as HTMLInputElement)?.value
    const company_name = (form.elements.namedItem('edit_company_name') as HTMLInputElement)?.value
    const rntrc_status = (form.elements.namedItem('edit_rntrc_status') as HTMLSelectElement)?.value
    setLoading(true)
    const res = await updateAdminCarrier(editCarrier.id, { rntrc, company_name, rntrc_status })
    setLoading(false)
    if (res.success) {
      toast.success('Transportadora atualizada')
      setEditCarrier(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleDelete = async () => {
    if (!deleteCarrier) return
    setLoading(true)
    const res = await deleteAdminCarrier(deleteCarrier.id)
    setLoading(false)
    if (res.success) {
      toast.success('Transportadora excluída')
      setDeleteCarrier(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const statusVariant = (s: string | null) => {
    if (s === 'ACTIVE') return 'default'
    if (s === 'INACTIVE' || s === 'EXPIRED') return 'destructive'
    return 'secondary'
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            name="search"
            placeholder="Buscar por nome, CNPJ, RNTRC..."
            defaultValue={searchParams.get('search') ?? ''}
            className="max-w-sm"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova transportadora
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>RNTRC</TableHead>
            <TableHead>Status RNTRC</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[140px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carriers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.companyName || c.company_name || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{c.document || '-'}</TableCell>
              <TableCell>{c.rntrc || '-'}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.rntrc_status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : c.rntrc_status === 'INACTIVE' || c.rntrc_status === 'EXPIRED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {c.rntrc_status || 'UNKNOWN'}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link href={`/admin/tabela-frete?carrier=${c.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Tabela de frete">
                      <Table2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCarrier(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteCarrier(c)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
                  router.push(`/admin/transportadoras?${params.toString()}`)
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
                  router.push(`/admin/transportadoras?${params.toString()}`)
                }}
              >
                Próxima
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova transportadora</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Usuário *</Label>
              <select name="user_id" className="w-full h-10 rounded-md border px-3" required>
                <option value="">Selecione...</option>
                {users.filter((u) => !u.hasCarrier).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
                {users.filter((u) => u.hasCarrier).length > 0 && (
                  <optgroup label="Já possui transportadora">
                    {users.filter((u) => u.hasCarrier).map((u) => (
                      <option key={u.id} value={u.id} disabled>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <Label>Empresa *</Label>
              <select name="company_id" className="w-full h-10 rounded-md border px-3" required>
                <option value="">Selecione...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_fantasia}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>RNTRC</Label>
              <Input name="rntrc" placeholder="Número RNTRC" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCarrier} onOpenChange={(o) => !o && setEditCarrier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar transportadora</DialogTitle>
          </DialogHeader>
          {editCarrier && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>RNTRC</Label>
                <Input name="edit_rntrc" defaultValue={editCarrier.rntrc || ''} />
              </div>
              <div>
                <Label>Nome da empresa (exibição)</Label>
                <Input name="edit_company_name" defaultValue={editCarrier.company_name || editCarrier.companyName || ''} />
              </div>
              <div>
                <Label>Status RNTRC</Label>
                <select name="edit_rntrc_status" className="w-full h-10 rounded-md border px-3" defaultValue={editCarrier.rntrc_status || 'UNKNOWN'}>
                  <option value="UNKNOWN">Desconhecido</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditCarrier(null)}>
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
      <AlertDialog open={!!deleteCarrier} onOpenChange={(o) => !o && setDeleteCarrier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transportadora?</AlertDialogTitle>
            <AlertDialogDescription>
              O vínculo da transportadora {deleteCarrier?.companyName || deleteCarrier?.company_name} será removido. O usuário continuará no sistema como cliente.
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
