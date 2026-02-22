'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface FreightRoute {
  id: string
  origin_zip: string
  dest_zip: string
  origin_zip_end?: string
  dest_zip_end?: string
  price_per_kg: number
  min_price: number
  deadline_days: number
  source_file?: string | null
  imported_at?: string | null
  rate_card?: {
    weight_0_30?: number
    weight_31_50?: number
    weight_51_70?: number
    weight_71_100?: number
    above_101_per_kg?: number
    dispatch_fee?: number
    gris_percent?: number
    insurance_percent?: number
    toll_per_100kg?: number
    icms_percent?: number
  } | null
}

function TabelaFretePage() {
  const supabase = createClient()
  const [routes, setRoutes] = useState<FreightRoute[]>([])
  const [loading, setLoading] = useState(true)

  const totalImported = useMemo(() => routes.length, [routes])

  const latestImportInfo = useMemo(() => {
    if (routes.length === 0) return null

    const withImportedAt = routes
      .filter((route) => route.imported_at)
      .sort((a, b) => new Date(b.imported_at as string).getTime() - new Date(a.imported_at as string).getTime())

    return withImportedAt[0] || null
  }, [routes])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('freight_routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Erro ao carregar as rotas')
        return
      }

      setRoutes((data ?? []) as FreightRoute[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const formatCep = (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`
    }
    return cep
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="container max-w-7xl py-10">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-800">Tabela de Fretes</h1>
        <p className="text-muted-foreground">
          Visualize suas rotas e preços cadastrados no sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rotas salvas no banco</p>
            <p className="text-2xl font-bold text-brand-700">{totalImported}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Última importação</p>
            <p className="text-sm font-semibold text-slate-800">
              {latestImportInfo?.imported_at
                ? new Date(latestImportInfo.imported_at).toLocaleString('pt-BR')
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Arquivo de origem</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {latestImportInfo?.source_file || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-brand-100">
        <CardHeader>
          <CardTitle>Rotas Cadastradas (somente leitura)</CardTitle>
          <CardDescription>
            Estas são as informações que estão persistidas no banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Prazo (dias)</TableHead>
                  <TableHead>Preço/kg</TableHead>
                  <TableHead>Preço mínimo</TableHead>
                  <TableHead>Arquivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma rota encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-mono text-sm">
                        {formatCep(route.origin_zip)}
                        {route.origin_zip_end && ` - ${formatCep(route.origin_zip_end)}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCep(route.dest_zip)}
                        {route.dest_zip_end && ` - ${formatCep(route.dest_zip_end)}`}
                      </TableCell>
                      <TableCell>{route.deadline_days}</TableCell>
                      <TableCell>{formatCurrency(route.price_per_kg)}</TableCell>
                      <TableCell>{formatCurrency(route.min_price)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {route.source_file || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TabelaFretePage
