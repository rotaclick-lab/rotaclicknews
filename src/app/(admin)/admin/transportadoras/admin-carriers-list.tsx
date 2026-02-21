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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/transportadoras?${params.toString()}`)
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  const statusVariant = (s: string | null) => {
    if (s === 'ACTIVE') return 'default'
    if (s === 'INACTIVE' || s === 'EXPIRED') return 'destructive'
    return 'secondary'
  }

  return (
    <div className="space-y-4">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>RNTRC</TableHead>
            <TableHead>Status RNTRC</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carriers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.companyName || c.company_name || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{c.document || '-'}</TableCell>
              <TableCell>{c.rntrc || '-'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(c.rntrc_status)}>
                  {c.rntrc_status || 'UNKNOWN'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
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
    </div>
  )
}
