'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Truck, DollarSign, Trash2, Search, Filter, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type InsertMode = 'single' | 'range'

interface FreightRoute {
  id: string
  origin_zip: string
  dest_zip: string
  origin_zip_end?: string
  dest_zip_end?: string
  price_per_kg: number
  min_price: number
  deadline_days: number
}

interface PricingAnalyzeResponse {
  success: boolean
  total_cost: number
  breakdown: {
    fuel: number
    variable: number
    fixed_alloc: number
    tolls: number
    time_cost: number
    fees: number
    empty_return: number
  }
  profit_value: number
  margin_percent: number
  classification: 'LOSS' | 'CRITICAL' | 'OK' | 'GREAT'
  blocking: boolean
  alerts: Array<{ severity: 'error' | 'warning' | 'info'; code: string; message: string }>
  suggestions: string[]
}

export default function TabelaFretePage() {
  const supabase = createClient()
  const [routes, setRoutes] = useState<FreightRoute[]>([])
  const [carrierId, setCarrierId] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<PricingAnalyzeResponse | null>(null)
  const [analysisInputs, setAnalysisInputs] = useState({
    km_estimado: 0,
    horas_estimadas: 0,
    pedagio_estimado: 0,
    vale_pedagio_included: false,
  })

  useEffect(() => {
    fetchRoutes()
    ensureCarrierProfile()
  }, [])

  const ensureCarrierProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: carrier } = await supabase
      .from('carriers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (carrier?.id) {
      setCarrierId(carrier.id)
      return
    }

    const { data: createdCarrier, error } = await supabase
      .from('carriers')
      .insert({
        user_id: user.id,
        company_name: user.user_metadata?.company_name ?? user.email,
      })
      .select('id')
      .single()

    if (error || !createdCarrier?.id) {
      setAnalysisError('Não foi possível inicializar o perfil regulatório da transportadora.')
      return
    }

    setCarrierId(createdCarrier.id)
  }

  const fetchRoutes = async () => {
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
  }

  const [insertMode, setInsertMode] = useState<InsertMode>('single')
  const [newRoute, setNewRoute] = useState<Partial<FreightRoute>>({
    origin_zip: '',
    dest_zip: '',
    origin_zip_end: '',
    dest_zip_end: '',
    price_per_kg: 0,
    min_price: 0,
    deadline_days: 0
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

  const analyzePricing = useCallback(async () => {
    if (!carrierId) return null

    const computedPrice = Math.max(Number(newRoute.price_per_kg ?? 0), Number(newRoute.min_price ?? 0))
    if (computedPrice <= 0 || analysisInputs.km_estimado <= 0) {
      setAnalyzeResult(null)
      return null
    }

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const response = await fetch('/api/pricing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier_id: carrierId,
          origem: { cep: newRoute.origin_zip ?? '' },
          destino: { cep: newRoute.dest_zip ?? '' },
          km_estimado: analysisInputs.km_estimado,
          horas_estimadas: analysisInputs.horas_estimadas,
          pedagio_estimado: analysisInputs.pedagio_estimado,
          modelo_de_preco: 'CEP_RANGE',
          price_input: computedPrice,
          vale_pedagio_included: analysisInputs.vale_pedagio_included,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setAnalysisError(data.error ?? 'Não foi possível analisar a regra no momento.')
        setAnalyzeResult(null)
        return null
      }

      setAnalyzeResult(data as PricingAnalyzeResponse)
      return data as PricingAnalyzeResponse
    } catch (error) {
      console.error('Erro ao analisar rentabilidade:', error)
      setAnalysisError('Erro de comunicação com o serviço de análise.')
      setAnalyzeResult(null)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [carrierId, newRoute.price_per_kg, newRoute.min_price, newRoute.origin_zip, newRoute.dest_zip, analysisInputs])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void analyzePricing()
    }, 300)

    return () => clearTimeout(timeout)
  }, [analyzePricing])

  const handleAddRoute = async () => {
    if (!newRoute.origin_zip || !newRoute.dest_zip) {
      toast.error('Preencha a origem e o destino')
      return
    }

    if (insertMode === 'range' && (!newRoute.origin_zip_end || !newRoute.dest_zip_end)) {
      toast.error('Preencha todos os CEPs do bloco')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const latestAnalysis = await analyzePricing()
    if (latestAnalysis?.blocking) {
      toast.error('Regra bloqueada por conformidade ANTT. Corrija os alertas antes de salvar.')
      return
    }

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
      setNewRoute({ origin_zip: '', dest_zip: '', origin_zip_end: '', dest_zip_end: '', price_per_kg: 0, min_price: 0, deadline_days: 0 })
      setAnalyzeResult(null)
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
        <div className="lg:col-span-1 space-y-6">
          {/* Form Card */}
          <Card className="border-2 border-brand-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand-500" /> Nova Rota
              </CardTitle>
              <CardDescription>Adicione uma nova regra de preço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Seletor de Modo */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Modo de Inserção</Label>
              <RadioGroup value={insertMode} onValueChange={(value) => setInsertMode(value as InsertMode)}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="cursor-pointer flex-1">
                    <div className="font-medium">CEP a CEP</div>
                    <div className="text-xs text-muted-foreground">Rota específica entre dois CEPs</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="range" id="range" />
                  <Label htmlFor="range" className="cursor-pointer flex-1">
                    <div className="font-medium">Bloco de CEPs</div>
                    <div className="text-xs text-muted-foreground">Faixa de CEPs de origem para destino</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-4">
              {/* Campos de Origem */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-brand-500" />
                  {insertMode === 'single' ? 'CEP Origem' : 'CEP Origem (Início)'}
                </Label>
                <Input 
                  placeholder="00000-000" 
                  value={newRoute.origin_zip} 
                  onChange={(e) => setNewRoute({...newRoute, origin_zip: maskCEP(e.target.value)})}
                />
              </div>
              
              {insertMode === 'range' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    CEP Origem (Fim)
                  </Label>
                  <Input 
                    placeholder="00000-000" 
                    value={newRoute.origin_zip_end} 
                    onChange={(e) => setNewRoute({...newRoute, origin_zip_end: maskCEP(e.target.value)})}
                  />
                </div>
              )}

              {/* Campos de Destino */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Truck className="h-3 w-3 text-brand-500" />
                  {insertMode === 'single' ? 'CEP Destino' : 'CEP Destino (Início)'}
                </Label>
                <Input 
                  placeholder="00000-000" 
                  value={newRoute.dest_zip} 
                  onChange={(e) => setNewRoute({...newRoute, dest_zip: maskCEP(e.target.value)})}
                />
              </div>
              
              {insertMode === 'range' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    CEP Destino (Fim)
                  </Label>
                  <Input 
                    placeholder="00000-000" 
                    value={newRoute.dest_zip_end} 
                    onChange={(e) => setNewRoute({...newRoute, dest_zip_end: maskCEP(e.target.value)})}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço/KG (R$)</Label>
                  <Input 
                    className="text-right"
                    value={newRoute.price_per_kg?.toFixed(2)} 
                    onChange={(e) => setNewRoute({...newRoute, price_per_kg: Number(maskDecimal(e.target.value))})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo (R$)</Label>
                  <Input 
                    className="text-right"
                    value={newRoute.min_price?.toFixed(2)} 
                    onChange={(e) => setNewRoute({...newRoute, min_price: Number(maskDecimal(e.target.value))})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo (Dias Úteis)</Label>
                <Input 
                  type="number" 
                  value={newRoute.deadline_days} 
                  onChange={(e) => setNewRoute({...newRoute, deadline_days: Number(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>KM Estimado *</Label>
                  <Input
                    type="number"
                    value={analysisInputs.km_estimado}
                    onChange={(e) => setAnalysisInputs({ ...analysisInputs, km_estimado: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas Estimadas</Label>
                  <Input
                    type="number"
                    value={analysisInputs.horas_estimadas}
                    onChange={(e) => setAnalysisInputs({ ...analysisInputs, horas_estimadas: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pedágio Estimado (R$)</Label>
                <Input
                  className="text-right"
                  value={analysisInputs.pedagio_estimado.toFixed(2)}
                  onChange={(e) => setAnalysisInputs({ ...analysisInputs, pedagio_estimado: Number(maskDecimal(e.target.value)) })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analysisInputs.vale_pedagio_included}
                  onChange={(e) => setAnalysisInputs({ ...analysisInputs, vale_pedagio_included: e.target.checked })}
                />
                Vale-pedágio incluído
              </label>
            </div>
            <Button className="w-full font-bold bg-brand-500 hover:bg-brand-600 text-white" onClick={handleAddRoute}>
              SALVAR ROTA NA TABELA
            </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Rentabilidade & Conformidade</CardTitle>
              <CardDescription>Análise em tempo real (ANTT + margem)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAnalyzing && <p className="text-sm text-muted-foreground">Analisando...</p>}
              {analysisError && <p className="text-sm text-red-500">{analysisError}</p>}

              {analyzeResult && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Custo Total</p>
                      <p className="font-bold">R$ {analyzeResult.total_cost.toFixed(2)}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground">Margem</p>
                      <p className="font-bold">{analyzeResult.margin_percent.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="rounded border p-2 text-sm">
                    <p className="text-muted-foreground">Classificação</p>
                    <p className="font-bold">{analyzeResult.classification}</p>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="font-semibold">Breakdown</p>
                    <p>Combustível: R$ {analyzeResult.breakdown.fuel.toFixed(2)}</p>
                    <p>Variável: R$ {analyzeResult.breakdown.variable.toFixed(2)}</p>
                    <p>Fixo rateado: R$ {analyzeResult.breakdown.fixed_alloc.toFixed(2)}</p>
                    <p>Pedágio: R$ {analyzeResult.breakdown.tolls.toFixed(2)}</p>
                    <p>Tempo: R$ {analyzeResult.breakdown.time_cost.toFixed(2)}</p>
                    <p>Taxas: R$ {analyzeResult.breakdown.fees.toFixed(2)}</p>
                    <p>Retorno vazio: R$ {analyzeResult.breakdown.empty_return.toFixed(2)}</p>
                  </div>

                  {analyzeResult.alerts.length > 0 && (
                    <div className="space-y-2">
                      {analyzeResult.alerts.map((alert) => (
                        <div key={alert.code} className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-brand-500" />
                            <div>
                              {route.origin_zip}
                              {route.origin_zip_end && (
                                <span className="text-muted-foreground"> até {route.origin_zip_end}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <div>
                              {route.dest_zip}
                              {route.dest_zip_end && (
                                <span className="text-muted-foreground"> até {route.dest_zip_end}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {route.price_per_kg.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-brand-600">
                          R$ {route.min_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                            {route.deadline_days}d
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
