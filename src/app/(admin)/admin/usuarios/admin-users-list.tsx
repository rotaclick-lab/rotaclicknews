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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  createAdminUser,
  updateAdminUser,
  updateUserRole,
  deleteAdminUser,
} from '@/app/actions/admin-actions'

interface User {
  id: string
  name: string | null
  full_name?: string | null
  email: string | null
  role: string | null
  company_id: string | null
  created_at: string
}

export function AdminUsersList({
  users,
  total,
  currentPage,
}: {
  users: User[]
  total: number
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/usuarios?${params.toString()}`)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value
    const role = (form.elements.namedItem('role') as HTMLSelectElement)?.value as 'transportadora' | 'cliente' | 'admin'
    if (!email || !password || !name) {
      toast.error('Preencha todos os campos')
      return
    }
    setLoading(true)
    const res = await createAdminUser({ email, password, name, role })
    setLoading(false)
    if (res.success) {
      toast.success('Usuário criado')
      setCreateOpen(false)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editUser) return
    const form = e.currentTarget
    const name = (form.elements.namedItem('edit_name') as HTMLInputElement)?.value
    const email = (form.elements.namedItem('edit_email') as HTMLInputElement)?.value
    const role = (form.elements.namedItem('edit_role') as HTMLSelectElement)?.value as 'transportadora' | 'cliente' | 'admin'
    setLoading(true)
    const res = await updateAdminUser(editUser.id, { name, full_name: name, email, role })
    setLoading(false)
    if (res.success) {
      toast.success('Usuário atualizado')
      setEditUser(null)
      router.refresh()
    } else toast.error(res.error)
  }

  const handleRoleChange = async (userId: string, role: 'transportadora' | 'cliente' | 'admin') => {
    const res = await updateUserRole(userId, role)
    if (res.success) {
      toast.success('Role atualizada')
      router.refresh()
    } else toast.error(res.error)
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setLoading(true)
    const res = await deleteAdminUser(deleteUser.id)
    setLoading(false)
    if (res.success) {
      toast.success('Usuário excluído')
      setDeleteUser(null)
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
            placeholder="Buscar por nome ou email..."
            defaultValue={searchParams.get('search') ?? ''}
            className="max-w-sm"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo usuário
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[140px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name || u.full_name || '-'}</TableCell>
              <TableCell>{u.email || '-'}</TableCell>
              <TableCell>
                <Select
                  value={u.role || 'cliente'}
                  onValueChange={(v) => handleRoleChange(u.id, v as 'transportadora' | 'cliente' | 'admin')}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="transportadora">Transportadora</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditUser(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteUser(u)}>
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
                  router.push(`/admin/usuarios?${params.toString()}`)
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
                  router.push(`/admin/usuarios?${params.toString()}`)
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
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input name="name" required placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Senha</Label>
              <Input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label>Role</Label>
              <select name="role" className="w-full h-10 rounded-md border px-3" defaultValue="cliente">
                <option value="admin">Admin</option>
                <option value="transportadora">Transportadora</option>
                <option value="cliente">Cliente</option>
              </select>
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
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input name="edit_name" defaultValue={editUser.name || editUser.full_name || ''} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="edit_email" type="email" defaultValue={editUser.email || ''} required />
              </div>
              <div>
                <Label>Role</Label>
                <select name="edit_role" className="w-full h-10 rounded-md border px-3" defaultValue={editUser.role || 'cliente'}>
                  <option value="admin">Admin</option>
                  <option value="transportadora">Transportadora</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
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
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário {deleteUser?.name || deleteUser?.email} será removido permanentemente.
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
