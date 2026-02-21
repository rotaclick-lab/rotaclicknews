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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', '1')
    router.push(`/admin/empresas?${params.toString()}`)
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  const formatCnpj = (v: string | null) => {
    if (!v) return '-'
    const d = v.replace(/\D/g, '')
    if (d.length !== 14) return v
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }

  return (
    <div className="space-y-4">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome / Razão</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>RNTRC</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
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
              <TableCell>
                {[c.city, c.state].filter(Boolean).join('/') || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={c.is_active ? 'default' : 'secondary'}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
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
    </div>
  )
}
