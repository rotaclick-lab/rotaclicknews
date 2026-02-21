'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/usuarios?${params.toString()}`)
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-4">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name || u.full_name || '-'}</TableCell>
              <TableCell>{u.email || '-'}</TableCell>
              <TableCell>
                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role || '-'}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('pt-BR')}
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
    </div>
  )
}
