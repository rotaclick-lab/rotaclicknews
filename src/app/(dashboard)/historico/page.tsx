'use client'

import { useState } from 'react'
import { History, CheckCircle2, XCircle, Clock, DollarSign, Truck, MapPin, Calendar, Search, Download, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const historicoMock = [
  {
    id: 'FRT-2026-001',
    dataContratacao: '08/02/2026',
    dataEntrega: '10/02/2026',
    cliente: 'Maria Oliveira',
    origem: 'São Paulo, SP',
    destino: 'Rio de Janeiro, RJ',
    tipoCarga: 'Eletrônicos',
    peso: '850 kg',
    distancia: '430 km',
    valor: 'R$ 2.450,00',
    status: 'entregue',
    avaliacao: 5,
  },
  {
    id: 'FRT-2026-002',
    dataContratacao: '05/02/2026',
    dataEntrega: '07/02/2026',
    cliente: 'Carlos Santos',
    origem: 'Curitiba, PR',
    destino: 'Florianópolis, SC',
    tipoCarga: 'Mudança Residencial',
    peso: '2.300 kg',
    distancia: '300 km',
    valor: 'R$ 3.800,00',
    status: 'entregue',
    avaliacao: 4,
  },
  {
    id: 'FRT-2026-003',
    dataContratacao: '02/02/2026',
    dataEntrega: null,
    cliente: 'Juliana Costa',
    origem: 'Recife, PE',
    destino: 'Salvador, BA',
    tipoCarga: 'Móveis',
    peso: '3.500 kg',
    distancia: '840 km',
    valor: 'R$ 5.600,00',
    status: 'em_transito',
    avaliacao: null,
  },
  {
    id: 'FRT-2026-004',
    dataContratacao: '28/01/2026',
    dataEntrega: '30/01/2026',
    cliente: 'Fernanda Souza',
    origem: 'Campinas, SP',
    destino: 'Ribeirão Preto, SP',
    tipoCarga: 'Peças Automotivas',
    peso: '780 kg',
    distancia: '310 km',
    valor: 'R$ 1.100,00',
    status: 'entregue',
    avaliacao: 5,
  },
  {
    id: 'FRT-2026-005',
    dataContratacao: '20/01/2026',
    dataEntrega: null,
    cliente: 'André Martins',
    origem: 'Manaus, AM',
    destino: 'Belém, PA',
    tipoCarga: 'Produtos Industriais',
    peso: '6.000 kg',
    distancia: '1.650 km',
    valor: 'R$ 12.500,00',
    status: 'cancelado',
    avaliacao: null,
  },
  {
    id: 'FRT-2025-098',
    dataContratacao: '15/01/2026',
    dataEntrega: '18/01/2026',
    cliente: 'Patrícia Mendes',
    origem: 'Belo Horizonte, MG',
    destino: 'Vitória, ES',
    tipoCarga: 'Materiais de Escritório',
    peso: '450 kg',
    distancia: '520 km',
    valor: 'R$ 1.800,00',
    status: 'entregue',
    avaliacao: 4,
  },
]

const statusConfig = {
  entregue: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  em_transito: { label: 'Em Trânsito', color: 'bg-brand-100 text-brand-700', icon: Truck },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function HistoricoPage() {
  const [filtro, setFiltro] = useState<'todos' | 'entregue' | 'em_transito' | 'cancelado'>('todos')
  const [busca, setBusca] = useState('')

  const historicoFiltrado = historicoMock.filter(h => {
    const matchFiltro = filtro === 'todos' || h.status === filtro
    const matchBusca = !busca ||
      h.origem.toLowerCase().includes(busca.toLowerCase()) ||
      h.destino.toLowerCase().includes(busca.toLowerCase()) ||
      h.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      h.id.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const totalEntregues = historicoMock.filter(h => h.status === 'entregue').length
  const totalEmTransito = historicoMock.filter(h => h.status === 'em_transito').length
  const faturamentoTotal = historicoMock
    .filter(h => h.status === 'entregue')
    .reduce((acc, h) => acc + parseFloat(h.valor.replace(/[^\d,]/g, '').replace(',', '.')), 0)

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-muted-foreground">Sem avaliação</span>
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <History className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{historicoMock.length}</p>
                <p className="text-xs text-muted-foreground">Total de Fretes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalEntregues}</p>
                <p className="text-xs text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Truck className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-700">{totalEmTransito}</p>
                <p className="text-xs text-muted-foreground">Em Trânsito</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Faturamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-brand-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'todos' as const, label: 'Todos' },
                { key: 'entregue' as const, label: 'Entregues' },
                { key: 'em_transito' as const, label: 'Em Trânsito' },
                { key: 'cancelado' as const, label: 'Cancelados' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    filtro === f.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar frete..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 focus-visible:ring-brand-500"
                />
              </div>
              <Button variant="outline" className="border-brand-200 text-brand-700 hover:bg-brand-50">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-3">
        {historicoFiltrado.length === 0 ? (
          <Card className="border-brand-100">
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 text-brand-200 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum frete encontrado com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          historicoFiltrado.map((frete) => {
            const statusInfo = statusConfig[frete.status as keyof typeof statusConfig]
            const StatusIcon = statusInfo.icon
            return (
              <Card key={frete.id} className={cn(
                'border-brand-100 hover:shadow-md transition-shadow',
                frete.status === 'entregue' && 'border-l-4 border-l-emerald-500',
                frete.status === 'em_transito' && 'border-l-4 border-l-brand-500',
                frete.status === 'cancelado' && 'border-l-4 border-l-red-400'
              )}>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-brand-700">{frete.id}</span>
                        <span className={cn(
                          'text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1',
                          statusInfo.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        {renderStars(frete.avaliacao)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-brand-500" />
                        <span className="font-medium">{frete.origem}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{frete.destino}</span>
                        <span className="text-xs text-muted-foreground ml-1">({frete.distancia})</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Contratado: {frete.dataContratacao}
                        </span>
                        {frete.dataEntrega && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Entregue: {frete.dataEntrega}
                          </span>
                        )}
                        <span>Cliente: {frete.cliente}</span>
                        <span>{frete.tipoCarga} • {frete.peso}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-800">{frete.valor}</p>
                      <p className="text-xs text-muted-foreground">Valor do frete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
