'use client'

import { useState } from 'react'
import { Eye, TrendingUp, Calendar, MapPin, Package, Filter, Search, ArrowUpDown, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Dados mockados de cotações recebidas
const cotacoesMock = [
  {
    id: 'COT-001',
    data: '10/02/2026',
    cliente: 'Maria Oliveira',
    origem: 'São Paulo, SP',
    destino: 'Rio de Janeiro, RJ',
    tipoCarga: 'Eletrônicos',
    peso: '850 kg',
    valorCotado: 'R$ 2.450,00',
    status: 'visualizada',
    contratada: false,
  },
  {
    id: 'COT-002',
    data: '09/02/2026',
    cliente: 'Carlos Santos',
    origem: 'Curitiba, PR',
    destino: 'Florianópolis, SC',
    tipoCarga: 'Mudança Residencial',
    peso: '2.300 kg',
    valorCotado: 'R$ 3.800,00',
    status: 'contratada',
    contratada: true,
  },
  {
    id: 'COT-003',
    data: '08/02/2026',
    cliente: 'Ana Ferreira',
    origem: 'Belo Horizonte, MG',
    destino: 'Brasília, DF',
    tipoCarga: 'Materiais de Construção',
    peso: '5.000 kg',
    valorCotado: 'R$ 6.200,00',
    status: 'expirada',
    contratada: false,
  },
  {
    id: 'COT-004',
    data: '07/02/2026',
    cliente: 'Pedro Lima',
    origem: 'Porto Alegre, RS',
    destino: 'São Paulo, SP',
    tipoCarga: 'Alimentos',
    peso: '1.200 kg',
    valorCotado: 'R$ 4.100,00',
    status: 'visualizada',
    contratada: false,
  },
  {
    id: 'COT-005',
    data: '06/02/2026',
    cliente: 'Juliana Costa',
    origem: 'Recife, PE',
    destino: 'Salvador, BA',
    tipoCarga: 'Móveis',
    peso: '3.500 kg',
    valorCotado: 'R$ 5.600,00',
    status: 'contratada',
    contratada: true,
  },
  {
    id: 'COT-006',
    data: '05/02/2026',
    cliente: 'Roberto Alves',
    origem: 'Goiânia, GO',
    destino: 'Uberlândia, MG',
    tipoCarga: 'Produtos Químicos',
    peso: '4.200 kg',
    valorCotado: 'R$ 3.200,00',
    status: 'visualizada',
    contratada: false,
  },
  {
    id: 'COT-007',
    data: '04/02/2026',
    cliente: 'Fernanda Souza',
    origem: 'Campinas, SP',
    destino: 'Ribeirão Preto, SP',
    tipoCarga: 'Peças Automotivas',
    peso: '780 kg',
    valorCotado: 'R$ 1.100,00',
    status: 'contratada',
    contratada: true,
  },
]

const statusConfig = {
  visualizada: { label: 'Visualizada', color: 'bg-brand-100 text-brand-700' },
  contratada: { label: 'Contratada', color: 'bg-emerald-100 text-emerald-700' },
  expirada: { label: 'Expirada', color: 'bg-gray-100 text-gray-600' },
}

export default function CotacoesRecebidasPage() {
  const [filtro, setFiltro] = useState<'todas' | 'visualizada' | 'contratada' | 'expirada'>('todas')
  const [busca, setBusca] = useState('')

  const cotacoesFiltradas = cotacoesMock.filter(c => {
    const matchFiltro = filtro === 'todas' || c.status === filtro
    const matchBusca = !busca || 
      c.origem.toLowerCase().includes(busca.toLowerCase()) ||
      c.destino.toLowerCase().includes(busca.toLowerCase()) ||
      c.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      c.id.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const totalCotacoes = cotacoesMock.length
  const totalContratadas = cotacoesMock.filter(c => c.contratada).length
  const taxaConversao = totalCotacoes > 0 ? ((totalContratadas / totalCotacoes) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Eye className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{totalCotacoes}</p>
                <p className="text-xs text-muted-foreground">Cotações Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalContratadas}</p>
                <p className="text-xs text-muted-foreground">Contratadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{taxaConversao}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Calendar className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">Fev/2026</p>
                <p className="text-xs text-muted-foreground">Período Atual</p>
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
                { key: 'todas' as const, label: 'Todas' },
                { key: 'visualizada' as const, label: 'Visualizadas' },
                { key: 'contratada' as const, label: 'Contratadas' },
                { key: 'expirada' as const, label: 'Expiradas' },
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
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cotação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 focus-visible:ring-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cotações */}
      <div className="space-y-3">
        {cotacoesFiltradas.length === 0 ? (
          <Card className="border-brand-100">
            <CardContent className="py-12 text-center">
              <Eye className="h-12 w-12 text-brand-200 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma cotação encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          cotacoesFiltradas.map((cotacao) => (
            <Card key={cotacao.id} className={cn(
              'border-brand-100 hover:shadow-md transition-shadow',
              cotacao.contratada && 'border-l-4 border-l-emerald-500'
            )}>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-700">{cotacao.id}</span>
                      <span className={cn(
                        'text-xs px-2.5 py-0.5 rounded-full font-medium',
                        statusConfig[cotacao.status as keyof typeof statusConfig].color
                      )}>
                        {statusConfig[cotacao.status as keyof typeof statusConfig].label}
                      </span>
                      <span className="text-xs text-muted-foreground">{cotacao.data}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-brand-500" />
                      <span className="font-medium">{cotacao.origem}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{cotacao.destino}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" /> {cotacao.tipoCarga}
                      </span>
                      <span>{cotacao.peso}</span>
                      <span>Cliente: {cotacao.cliente}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-800">{cotacao.valorCotado}</p>
                    <p className="text-xs text-muted-foreground">Valor cotado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
