'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Truck, DollarSign, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface FreightRoute {
  id: string
  originZip: string
  destZip: string
  pricePerKg: number
  minPrice: number
  deadlineDays: number
}

interface FreightRouteRow {
  id: string
  origin_zip: string
  dest_zip: string
  price_per_kg: number
  min_price: number
  deadline_days: number
}

const mapRowToRoute = (row: FreightRouteRow): FreightRoute => ({
  id: row.id,
  originZip: row.origin_zip,
  destZip: row.dest_zip,
  pricePerKg: row.price_per_kg,
  minPrice: row.min_price,
  deadlineDays: row.deadline_days,
})

export default function TabelaFretePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<FreightRoute[]>([])

  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('freight_routes')
      .select('*')
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar rotas')
    } else {
      setRoutes((data || []).map((row) => mapRowToRoute(row as FreightRouteRow)))
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  const [newRoute, setNewRoute] = useState<Partial<FreightRoute>>({
    originZip: '',
    destZip: '',
    pricePerKg: 0,
    minPrice: 0,
    deadlineDays: 0,
  })

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const maskDecimal = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const numberValue = Number(cleanValue) / 100
    return numberValue.toFixed(2)
  }

  const handleAddRoute = async () => {
    if (!newRoute.originZip || !newRoute.destZip) {
      toast.error('Preencha a origem e o destino')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('freight_routes').insert([
      {
        origin_zip: newRoute.originZip,
        dest_zip: newRoute.destZip,
        price_per_kg: newRoute.pricePerKg,
        min_price: newRoute.minPrice,
        deadline_days: newRoute.deadlineDays,
        carrier_id: user.id,
      },
    ])

    if (error) {
      toast.error('Erro ao salvar rota no banco de dados')
    } else {
      toast.success('Rota adicionada com sucesso!')
      fetchRoutes()
      setNewRoute({ originZip: '', destZip: '', pricePerKg: 0, minPrice: 0, deadlineDays: 0 })
    }
  }

  const removeRoute = async (id: string) => {
    const { error } = await supabase.from('freight_routes').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao remover rota')
    } else {
      toast.info('Rota removida')
      fetchRoutes()
    }
  }

  return (
    <div className="container max-w-6xl space-y-8 py-10">
      <div>
        <h1 className="text-brand-800 text-3xl font-bold tracking-tight">Tabela de Fretes</h1>
        <p className="text-muted-foreground">Configure suas rotas, preços e prazos para automatizar suas cotações.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="border-brand-200 lg:col-span-1 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="text-brand-500 h-5 w-5" /> Nova Rota
            </CardTitle>
            <CardDescription>Adicione uma nova regra de preço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>CEP Origem (Início)</Label>
                <Input
                  placeholder="00000-000"
                  value={newRoute.originZip}
                  onChange={(e) => setNewRoute({ ...newRoute, originZip: maskCEP(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Destino (Início)</Label>
                <Input
                  placeholder="00000-000"
                  value={newRoute.destZip}
                  onChange={(e) => setNewRoute({ ...newRoute, destZip: maskCEP(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço/KG (R$)</Label>
                  <Input
                    className="text-right"
                    value={newRoute.pricePerKg?.toFixed(2)}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        pricePerKg: Number(maskDecimal(e.target.value)),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo (R$)</Label>
                  <Input
                    className="text-right"
                    value={newRoute.minPrice?.toFixed(2)}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        minPrice: Number(maskDecimal(e.target.value)),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo (Dias Úteis)</Label>
                <Input
                  type="number"
                  value={newRoute.deadlineDays}
                  onChange={(e) => setNewRoute({ ...newRoute, deadlineDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button className="bg-brand-500 hover:bg-brand-600 w-full font-bold text-white" onClick={handleAddRoute}>
              SALVAR ROTA NA TABELA
            </Button>
          </CardContent>
        </Card>

        <Card className="border-brand-100 lg:col-span-2 border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Suas Rotas Ativas</CardTitle>
              <CardDescription>Listagem de todas as regras de frete configuradas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead className="text-right">Preço/KG</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-center">Prazo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-10 text-center italic">
                        Carregando rotas...
                      </TableCell>
                    </TableRow>
                  ) : routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-10 text-center italic">
                        Nenhuma rota cadastrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="flex items-center gap-2 font-medium">
                          <MapPin className="text-brand-500 h-3 w-3" /> {route.originZip}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="text-muted-foreground h-3 w-3" /> {route.destZip}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">R$ {route.pricePerKg.toFixed(2)}</TableCell>
                        <TableCell className="text-brand-600 text-right font-semibold">R$ {route.minPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <span className="bg-brand-50 text-brand-700 rounded px-2 py-1 text-xs font-bold">{route.deadlineDays}d</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => removeRoute(route.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <div className="bg-brand-50 border-brand-200 flex items-start gap-4 rounded-xl border p-6">
        <div className="bg-brand-100 rounded-full p-3">
          <DollarSign className="text-brand-600 h-6 w-6" />
        </div>
        <div>
          <h4 className="text-brand-700 font-bold">Como os valores são calculados?</h4>
          <p className="text-muted-foreground mt-1 text-sm">
            O sistema utiliza o <strong>Peso Taxável</strong> (maior valor entre peso real e cubado) multiplicado pelo seu{' '}
            <strong>Preço/KG</strong>. Se o resultado for menor que o seu <strong>Valor Mínimo</strong>, o sistema aplicará
            automaticamente o mínimo configurado para aquela rota.
          </p>
        </div>
      </div>
    </div>
  )
}
