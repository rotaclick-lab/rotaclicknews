'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
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
  createAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  toggleAdminCompanyActive,
} from '@/app/actions/admin-actions'

interface Company {
  id: string
  name: string | null
  document: string | null
  email: string | null
  razao_social: string | null
  nome_fantasia: string | null
  rntrc: string | null
  city: string | null
  state: string | null
  is_active: boolean | null
  created_at: string
}

export function AdminCompaniesList({
  companies,
  total,
  currentPage,
}: {
  companies: Company[]
  total: number
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/empresas?${params.toString()}`)
  }

  const formatCnpj = (v: string | null) => {
    if (!v) return '-'
    const d = v.replace(/\D/g, '')
    if (d.length !== 14) return v
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value
    const document = (form.elements.namedItem('document') as HTMLInputElement)?.value
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
    const razao_social = (form.elements.namedItem('razao_social') as HTMLInputElement)?.value
    const nome_fantasia = (form.elements.namedItem('nome_fantasia') as HTMLInputElement)?.value
    const rntrc = (form.elements.namedItem('rntrc') as HTMLInputElement)?.value
    const city = (form.elements.namedItem('city') as HTMLInputElement)?.value
    const state = (form.elements.namedItem('state') as HTMLInputElement)?.value
    if (!document || !email) {
      toast.error('CNPJ e email são obrigatórios')
      return
    }
    setLoading(true)
    const res = await createAdminCompany({
      name: nome_fantasia || razao_social || name || 'Empresa',
      document,
      email,
      razao_social: razao_social || name,
      nome_fantasia: nome_fantasia || name,
      rntrc: rntrc || undefined,
      city: city || undefined,
      state: state || undefined,
    })
    setLoading(false)
    if (res.success) {
      toast.success('Empresa criada')
      setCreateOpen(false)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editCompany) return
    const form = e.currentTarget
    const updates = {
      name: (form.elements.namedItem('edit_name') as HTMLInputElement)?.value,
      document: (form.elements.namedItem('edit_document') as HTMLInputElement)?.value,
      email: (form.elements.namedItem('edit_email') as HTMLInputElement)?.value,
      razao_social: (form.elements.namedItem('edit_razao_social') as HTMLInputElement)?.value,
      nome_fantasia: (form.elements.namedItem('edit_nome_fantasia') as HTMLInputElement)?.value,
      rntrc: (form.elements.namedItem('edit_rntrc') as HTMLInputElement)?.value,
      city: (form.elements.namedItem('edit_city') as HTMLInputElement)?.value,
      state: (form.elements.namedItem('edit_state') as HTMLInputElement)?.value,
    }
    setLoading(true)
    const res = await updateAdminCompany(editCompany.id, updates)
    setLoading(false)
    if (res.success) {
      toast.success('Empresa atualizada')
      setEditCompany(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleToggleActive = async (c: Company) => {
    const res = await toggleAdminCompanyActive(c.id)
    if (res.success) {
      toast.success(res.is_active ? 'Empresa ativada' : 'Empresa desativada')
      router.refresh()
    } else toast.error(res.error)
  }

  const handleDelete = async () => {
    if (!deleteCompany) return
    setLoading(true)
    const res = await deleteAdminCompany(deleteCompany.id)
    setLoading(false)
    if (res.success) {
      toast.success('Empresa excluída')
      setDeleteCompany(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            name="search"
            placeholder="Buscar por nome, CNPJ, email..."
            defaultValue={searchParams.get('search') ?? ''}
            className="max-w-sm"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova empresa
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome / Razão</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>RNTRC</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.nome_fantasia || c.razao_social || c.name || '-'}
              </TableCell>
              <TableCell className="font-mono text-sm">{formatCnpj(c.document)}</TableCell>
              <TableCell>{c.rntrc || '-'}</TableCell>
              <TableCell>{[c.city, c.state].filter(Boolean).join('/') || '-'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1"
                  onClick={() => handleToggleActive(c)}
                  title={c.is_active ? 'Desativar' : 'Ativar'}
                >
                  {c.is_active ? (
                    <span className="text-green-600 font-medium">Ativo</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Inativo</span>
                  )}
                </Button>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCompany(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteCompany(c)}>
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
                  router.push(`/admin/empresas?${params.toString()}`)
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
                  router.push(`/admin/empresas?${params.toString()}`)
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Razão Social *</Label>
              <Input name="razao_social" placeholder="Razão social" />
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <Input name="nome_fantasia" placeholder="Nome fantasia" />
            </div>
            <div>
              <Label>CNPJ *</Label>
              <Input name="document" placeholder="00.000.000/0001-00" required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input name="email" type="email" placeholder="email@empresa.com" required />
            </div>
            <div>
              <Label>RNTRC</Label>
              <Input name="rntrc" placeholder="Número RNTRC" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cidade</Label>
                <Input name="city" placeholder="Cidade" />
              </div>
              <div>
                <Label>UF</Label>
                <Input name="state" placeholder="UF" maxLength={2} />
              </div>
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
      <Dialog open={!!editCompany} onOpenChange={(o) => !o && setEditCompany(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
          </DialogHeader>
          {editCompany && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Razão Social</Label>
                <Input name="edit_razao_social" defaultValue={editCompany.razao_social || ''} />
              </div>
              <div>
                <Label>Nome Fantasia</Label>
                <Input name="edit_nome_fantasia" defaultValue={editCompany.nome_fantasia || ''} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input name="edit_document" defaultValue={formatCnpj(editCompany.document)} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="edit_email" type="email" defaultValue={editCompany.email || ''} required />
              </div>
              <div>
                <Label>RNTRC</Label>
                <Input name="edit_rntrc" defaultValue={editCompany.rntrc || ''} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cidade</Label>
                  <Input name="edit_city" defaultValue={editCompany.city || ''} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input name="edit_state" defaultValue={editCompany.state || ''} maxLength={2} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditCompany(null)}>
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
      <AlertDialog open={!!deleteCompany} onOpenChange={(o) => !o && setDeleteCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A empresa {deleteCompany?.nome_fantasia || deleteCompany?.razao_social} será removida permanentemente.
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
