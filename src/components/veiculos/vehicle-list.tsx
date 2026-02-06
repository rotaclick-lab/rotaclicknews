'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, Pencil, Trash2, MoreHorizontal, Car, AlertTriangle } from 'lucide-react'
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
import { VehicleStatusBadge } from './vehicle-status-badge'
import { VehicleTypeBadge } from './vehicle-type-badge'
import { VehicleDeleteDialog } from './vehicle-delete-dialog'
import type { VehicleWithRelations } from '@/types/vehicle.types'

interface VehicleListProps {
  vehicles: VehicleWithRelations[]
  total: number
  currentPage: number
}

export function VehicleList({ vehicles, total, currentPage }: VehicleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<{
    id: string
    plate: string
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
    router.push(`/veiculos?${params.toString()}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.set('page', '1')
    router.push(`/veiculos?${params.toString()}`)
  }

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }
    params.set('page', '1')
    router.push(`/veiculos?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/veiculos?${params.toString()}`)
  }

  const handleDelete = (id: string, plate: string) => {
    setSelectedVehicle({ id, plate })
    setDeleteDialogOpen(true)
  }

  const hasExpiringDocuments = (vehicle: VehicleWithRelations) => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const checkDate = (dateStr: string | null) => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date >= today && date <= thirtyDaysFromNow
    }

    return (
      checkDate(vehicle.crlv_expiry_date) ||
      checkDate(vehicle.ipva_expiry_date) ||
      checkDate(vehicle.insurance_expiry_date)
    )
  }

  const hasExpiredDocuments = (vehicle: VehicleWithRelations) => {
    const today = new Date()

    const checkDate = (dateStr: string | null) => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date < today
    }

    return (
      checkDate(vehicle.crlv_expiry_date) ||
      checkDate(vehicle.ipva_expiry_date) ||
      checkDate(vehicle.insurance_expiry_date)
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <Input
              placeholder="Buscar por placa, modelo, marca..."
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
                <SelectItem value="maintenance">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>

            <Select
              defaultValue={searchParams.get('type') || 'all'}
              onValueChange={handleTypeFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="truck">Caminhão</SelectItem>
                <SelectItem value="van">Van/Furgão</SelectItem>
                <SelectItem value="semi_trailer">Carreta</SelectItem>
                <SelectItem value="trailer">Reboque</SelectItem>
                <SelectItem value="pickup">Picape</SelectItem>
                <SelectItem value="motorcycle">Moto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum veículo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro veículo ou ajuste os filtros de busca.
          </p>
          <Link href="/veiculos/novo">
            <Button>Criar Primeiro Veículo</Button>
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
            placeholder="Buscar por placa, modelo, marca..."
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
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={searchParams.get('type') || 'all'}
            onValueChange={handleTypeFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="truck">Caminhão</SelectItem>
              <SelectItem value="van">Van/Furgão</SelectItem>
              <SelectItem value="semi_trailer">Carreta</SelectItem>
              <SelectItem value="trailer">Reboque</SelectItem>
              <SelectItem value="pickup">Picape</SelectItem>
              <SelectItem value="motorcycle">Moto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo/Marca</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium font-mono">
                  <div className="flex items-center gap-2">
                    {vehicle.plate}
                    {hasExpiredDocuments(vehicle) && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {!hasExpiredDocuments(vehicle) && hasExpiringDocuments(vehicle) && (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{vehicle.model}</span>
                    <span className="text-sm text-muted-foreground">{vehicle.brand}</span>
                  </div>
                </TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>
                  <VehicleTypeBadge type={vehicle.type} />
                </TableCell>
                <TableCell className="text-sm">
                  {vehicle.capacity_kg && (
                    <div>{vehicle.capacity_kg}kg</div>
                  )}
                  {vehicle.capacity_m3 && (
                    <div className="text-muted-foreground">{vehicle.capacity_m3}m³</div>
                  )}
                  {!vehicle.capacity_kg && !vehicle.capacity_m3 && 'N/A'}
                </TableCell>
                <TableCell>
                  <VehicleStatusBadge status={vehicle.status} />
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
                        <Link href={`/veiculos/${vehicle.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/veiculos/${vehicle.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(vehicle.id, vehicle.plate)}
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
            Página {currentPage} de {totalPages} • Total: {total} veículo(s)
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
      <VehicleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vehicleId={selectedVehicle?.id || null}
        vehiclePlate={selectedVehicle?.plate || undefined}
      />
    </div>
  )
}
