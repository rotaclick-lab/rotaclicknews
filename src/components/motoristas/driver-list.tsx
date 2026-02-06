'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, Pencil, Trash2, MoreHorizontal, Users, AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DriverStatusBadge } from './driver-status-badge'
import { DriverDeleteDialog } from './driver-delete-dialog'
import type { DriverWithRelations } from '@/types/driver.types'
import { formatDocument, formatDate } from '@/lib/utils'

interface DriverListProps {
  drivers: DriverWithRelations[]
  total: number
  currentPage: number
}

export function DriverList({ drivers, total, currentPage }: DriverListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<{
    id: string
    name: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const perPage = 10
  const totalPages = Math.ceil(total / perPage)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/motoristas?${params.toString()}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.set('page', '1')
    router.push(`/motoristas?${params.toString()}`)
  }

  const handleCategoryFilter = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('license_category')
    } else {
      params.set('license_category', category)
    }
    params.set('page', '1')
    router.push(`/motoristas?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/motoristas?${params.toString()}`)
  }

  const handleDelete = (id: string, name: string) => {
    setSelectedDriver({ id, name })
    setDeleteDialogOpen(true)
  }

  const isLicenseExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isLicenseExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  if (drivers.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <Input
              placeholder="Buscar por nome, CPF, CNH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit">Buscar</Button>
          </form>

          <div className="flex gap-2">
            <Select
              defaultValue={searchParams.get('status') || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="on_vacation">De Férias</SelectItem>
              </SelectContent>
            </Select>

            <Select
              defaultValue={searchParams.get('license_category') || 'all'}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria CNH" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="E">E</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum motorista encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro motorista ou ajuste os filtros de busca.
          </p>
          <Link href="/motoristas/novo">
            <Button>Criar Primeiro Motorista</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <Input
            placeholder="Buscar por nome, CPF, CNH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit">Buscar</Button>
        </form>

        <div className="flex gap-2">
          <Select
            defaultValue={searchParams.get('status') || 'all'}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="on_vacation">De Férias</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get('license_category') || 'all'}
            onValueChange={handleCategoryFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria CNH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="E">E</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CNH</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Validade CNH</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {driver.name}
                    {isLicenseExpired(driver.license_expiry_date) && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {isLicenseExpiringSoon(driver.license_expiry_date) && (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDocument(driver.cpf)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {driver.license_number}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{driver.license_category}</Badge>
                </TableCell>
                <TableCell>
                  {driver.license_expiry_date ? (
                    <span
                      className={
                        isLicenseExpired(driver.license_expiry_date)
                          ? 'text-red-600 font-medium'
                          : isLicenseExpiringSoon(driver.license_expiry_date)
                          ? 'text-orange-600 font-medium'
                          : ''
                      }
                    >
                      {formatDate(driver.license_expiry_date)}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <DriverStatusBadge status={driver.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/motoristas/${driver.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/motoristas/${driver.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(driver.id, driver.name)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} • Total: {total} motorista(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <DriverDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        driverId={selectedDriver?.id || null}
        driverName={selectedDriver?.name}
      />
    </div>
  )
}
