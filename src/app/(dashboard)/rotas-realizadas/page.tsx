'use client'

import { useState } from 'react'
import { Route, MapPin, Calendar, Truck, ArrowRight, TrendingUp, Repeat, Navigation, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const rotasMock = [
  {
    id: 'RTA-001',
    origem: 'São Paulo, SP',
    destino: 'Rio de Janeiro, RJ',
    distancia: '430 km',
    tempoMedio: '6h 30min',
    vezesRealizada: 12,
    ultimaViagem: '10/02/2026',
    faturamentoTotal: 'R$ 29.400,00',
    pedagios: 'R$ 1.200,00',
    tiposCarga: ['Eletrônicos', 'Mudanças', 'Geral'],
  },
  {
    id: 'RTA-002',
    origem: 'Curitiba, PR',
    destino: 'Florianópolis, SC',
    distancia: '300 km',
    tempoMedio: '4h 15min',
    vezesRealizada: 8,
    ultimaViagem: '07/02/2026',
    faturamentoTotal: 'R$ 18.400,00',
    pedagios: 'R$ 680,00',
    tiposCarga: ['Mudanças', 'Móveis'],
  },
  {
    id: 'RTA-003',
    origem: 'Belo Horizonte, MG',
    destino: 'Brasília, DF',
    distancia: '740 km',
    tempoMedio: '9h 00min',
    vezesRealizada: 5,
    ultimaViagem: '01/02/2026',
    faturamentoTotal: 'R$ 31.000,00',
    pedagios: 'R$ 1.800,00',
    tiposCarga: ['Materiais de Construção', 'Industriais'],
  },
  {
    id: 'RTA-004',
    origem: 'Porto Alegre, RS',
    destino: 'São Paulo, SP',
    distancia: '1.100 km',
    tempoMedio: '14h 00min',
    vezesRealizada: 6,
    ultimaViagem: '05/02/2026',
    faturamentoTotal: 'R$ 24.600,00',
    pedagios: 'R$ 2.400,00',
    tiposCarga: ['Alimentos', 'Peças Automotivas'],
  },
  {
    id: 'RTA-005',
    origem: 'Recife, PE',
    destino: 'Salvador, BA',
    distancia: '840 km',
    tempoMedio: '11h 30min',
    vezesRealizada: 3,
    ultimaViagem: '28/01/2026',
    faturamentoTotal: 'R$ 16.800,00',
    pedagios: 'R$ 950,00',
    tiposCarga: ['Móveis', 'Geral'],
  },
  {
    id: 'RTA-006',
    origem: 'Campinas, SP',
    destino: 'Ribeirão Preto, SP',
    distancia: '310 km',
    tempoMedio: '3h 45min',
    vezesRealizada: 15,
    ultimaViagem: '09/02/2026',
    faturamentoTotal: 'R$ 16.500,00',
    pedagios: 'R$ 450,00',
    tiposCarga: ['Peças Automotivas', 'Eletrônicos', 'Geral'],
  },
  {
    id: 'RTA-007',
    origem: 'Goiânia, GO',
    destino: 'Uberlândia, MG',
    distancia: '430 km',
    tempoMedio: '5h 30min',
    vezesRealizada: 4,
    ultimaViagem: '03/02/2026',
    faturamentoTotal: 'R$ 12.800,00',
    pedagios: 'R$ 720,00',
    tiposCarga: ['Produtos Químicos', 'Industriais'],
  },
]

export default function RotasRealizadasPage() {
  const [busca, setBusca] = useState('')
  const [ordenar, setOrdenar] = useState<'frequencia' | 'faturamento' | 'recente'>('frequencia')

  const rotasFiltradas = rotasMock
    .filter(r => {
      if (!busca) return true
      return r.origem.toLowerCase().includes(busca.toLowerCase()) ||
        r.destino.toLowerCase().includes(busca.toLowerCase())
    })
    .sort((a, b) => {
      if (ordenar === 'frequencia') return b.vezesRealizada - a.vezesRealizada
      if (ordenar === 'faturamento') {
        const valA = parseFloat(a.faturamentoTotal.replace(/[^\d,]/g, '').replace(',', '.'))
        const valB = parseFloat(b.faturamentoTotal.replace(/[^\d,]/g, '').replace(',', '.'))
        return valB - valA
      }
      return 0 // recente - já está ordenado
    })

  const totalRotas = rotasMock.length
  const totalViagens = rotasMock.reduce((acc, r) => acc + r.vezesRealizada, 0)
  const rotaMaisFrequente = rotasMock.reduce((prev, curr) => curr.vezesRealizada > prev.vezesRealizada ? curr : prev)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Route className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{totalRotas}</p>
                <p className="text-xs text-muted-foreground">Rotas Diferentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalViagens}</p>
                <p className="text-xs text-muted-foreground">Viagens Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <Repeat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{rotaMaisFrequente.vezesRealizada}x</p>
                <p className="text-xs text-muted-foreground">Rota Mais Frequente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Navigation className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-800 truncate" title={`${rotaMaisFrequente.origem} → ${rotaMaisFrequente.destino}`}>
                  {rotaMaisFrequente.origem.split(',')[0]} → {rotaMaisFrequente.destino.split(',')[0]}
                </p>
                <p className="text-xs text-muted-foreground">Top Rota</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ordenação */}
      <Card className="border-brand-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'frequencia' as const, label: 'Mais Frequentes' },
                { key: 'faturamento' as const, label: 'Maior Faturamento' },
                { key: 'recente' as const, label: 'Mais Recentes' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setOrdenar(f.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    ordenar === f.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rota..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 focus-visible:ring-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Rotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rotasFiltradas.length === 0 ? (
          <Card className="border-brand-100 md:col-span-2">
            <CardContent className="py-12 text-center">
              <Route className="h-12 w-12 text-brand-200 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma rota encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          rotasFiltradas.map((rota) => (
            <Card key={rota.id} className="border-brand-100 hover:shadow-md transition-shadow group">
              <CardContent className="pt-6">
                {/* Rota visual */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                      <span className="text-sm font-bold text-brand-800">{rota.origem}</span>
                    </div>
                    <div className="ml-1.5 w-0.5 h-6 bg-gradient-to-b from-brand-300 to-orange-300 my-1" />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                      <span className="text-sm font-bold text-orange-700">{rota.destino}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-brand-50 px-3 py-1.5 rounded-lg">
                      <p className="text-lg font-black text-brand-700">{rota.vezesRealizada}x</p>
                      <p className="text-[10px] text-muted-foreground">realizadas</p>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Distância</p>
                    <p className="font-bold text-brand-800">{rota.distancia}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Tempo Médio</p>
                    <p className="font-bold text-brand-800">{rota.tempoMedio}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Faturamento Total</p>
                    <p className="font-bold text-emerald-700">{rota.faturamentoTotal}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Pedágios (total)</p>
                    <p className="font-bold text-orange-700">{rota.pedagios}</p>
                  </div>
                </div>

                {/* Tags de carga */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {rota.tiposCarga.map((tipo) => (
                    <span key={tipo} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                      {tipo}
                    </span>
                  ))}
                </div>

                {/* Última viagem */}
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Última viagem: {rota.ultimaViagem}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
