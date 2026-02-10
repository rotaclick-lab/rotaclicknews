'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Truck, DollarSign, Clock, Trash2, Save, Search, Filter } from 'lucide-react'
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

export default function TabelaFretePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<FreightRoute[]>([])

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('freight_routes')
      .select('*')
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar rotas')
    } else {
      setRoutes(data || [])
    }
    setLoading(false)
  }

  const [newRoute, setNewRoute] = useState<Partial<FreightRoute>>({
    originZip: '',
    destZip: '',
    pricePerKg: 0,
    minPrice: 0,
    deadlineDays: 0
  })

  // Máscaras (Reutilizando lógica solicitada)
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('freight_routes')
      .insert([{
        ...newRoute,
        carrier_id: user.id
      }])

    if (error) {
      toast.error('Erro ao salvar rota no banco de dados')
    } else {
      toast.success('Rota adicionada com sucesso!')
      fetchRoutes()
      setNewRoute({ originZip: '', destZip: '', pricePerKg: 0, minPrice: 0, deadlineDays: 0 })
    }
  }

  const removeRoute = async (id: string) => {
    const { error } = await supabase
      .from('freight_routes')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao remover rota')
    } else {
      toast.info('Rota removida')
      fetchRoutes()
    }
  }

  return (
    <div className="container max-w-6xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-800">Tabela de Fretes</h1>
        <p className="text-muted-foreground">
          Configure suas rotas, preços e prazos para automatizar suas cotações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <Card className="lg:col-span-1 border-2 border-brand-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-500" /> Nova Rota
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
                  onChange={(e) => setNewRoute({...newRoute, originZip: maskCEP(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Destino (Início)</Label>
                <Input 
                  placeholder="00000-000" 
                  value={newRoute.destZip} 
                  onChange={(e) => setNewRoute({...newRoute, destZip: maskCEP(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço/KG (R$)</Label>
                  <Input 
                    className="text-right"
                    value={newRoute.pricePerKg?.toFixed(2)} 
                    onChange={(e) => setNewRoute({...newRoute, pricePerKg: Number(maskDecimal(e.target.value))})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo (R$)</Label>
                  <Input 
                    className="text-right"
                    value={newRoute.minPrice?.toFixed(2)} 
                    onChange={(e) => setNewRoute({...newRoute, minPrice: Number(maskDecimal(e.target.value))})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo (Dias Úteis)</Label>
                <Input 
                  type="number" 
                  value={newRoute.deadlineDays} 
                  onChange={(e) => setNewRoute({...newRoute, deadlineDays: Number(e.target.value)})}
                />
              </div>
            </div>
            <Button className="w-full font-bold bg-brand-500 hover:bg-brand-600 text-white" onClick={handleAddRoute}>
              SALVAR ROTA NA TABELA
            </Button>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="lg:col-span-2 border-2 border-brand-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Suas Rotas Ativas</CardTitle>
              <CardDescription>Listagem de todas as regras de frete configuradas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
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
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                        Nenhuma rota cadastrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-brand-500" /> {route.originZip}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-muted-foreground" /> {route.destZip}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {route.pricePerKg.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-brand-600">
                          R$ {route.minPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                            {route.deadlineDays}d
                          </span>
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

      {/* Info Banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 flex items-start gap-4">
        <div className="bg-brand-100 p-3 rounded-full">
          <DollarSign className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h4 className="font-bold text-brand-700">Como os valores são calculados?</h4>
          <p className="text-sm text-muted-foreground mt-1">
            O sistema utiliza o <strong>Peso Taxável</strong> (maior valor entre peso real e cubado) multiplicado pelo seu <strong>Preço/KG</strong>. 
            Se o resultado for menor que o seu <strong>Valor Mínimo</strong>, o sistema aplicará automaticamente o mínimo configurado para aquela rota.
          </p>
        </div>
      </div>
    </div>
  )
}
