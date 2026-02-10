'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Eye, TrendingUp, DollarSign, Route, Truck, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Calendar, BarChart3, PieChart as PieChartIcon,
  Activity, Target, Clock, Star, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ===== DADOS MOCKADOS DE BI =====

// Faturamento mensal (últimos 12 meses)
const faturamentoMensal = [
  { mes: 'Mar', valor: 18500, cotacoes: 12 },
  { mes: 'Abr', valor: 22300, cotacoes: 15 },
  { mes: 'Mai', valor: 19800, cotacoes: 11 },
  { mes: 'Jun', valor: 28400, cotacoes: 20 },
  { mes: 'Jul', valor: 31200, cotacoes: 22 },
  { mes: 'Ago', valor: 26700, cotacoes: 18 },
  { mes: 'Set', valor: 33500, cotacoes: 25 },
  { mes: 'Out', valor: 29800, cotacoes: 21 },
  { mes: 'Nov', valor: 35200, cotacoes: 28 },
  { mes: 'Dez', valor: 42100, cotacoes: 35 },
  { mes: 'Jan', valor: 38600, cotacoes: 30 },
  { mes: 'Fev', valor: 15400, cotacoes: 14 },
]

// Cotações vs Contratações por mês
const cotacoesVsContratacoes = [
  { mes: 'Set', cotacoes: 25, contratacoes: 10 },
  { mes: 'Out', cotacoes: 21, contratacoes: 9 },
  { mes: 'Nov', cotacoes: 28, contratacoes: 14 },
  { mes: 'Dez', cotacoes: 35, contratacoes: 18 },
  { mes: 'Jan', cotacoes: 30, contratacoes: 15 },
  { mes: 'Fev', cotacoes: 14, contratacoes: 7 },
]

// Status dos fretes
const statusFretes = [
  { name: 'Entregues', value: 42, color: '#10b981' },
  { name: 'Em Trânsito', value: 5, color: '#2BBCB3' },
  { name: 'Pendentes', value: 3, color: '#f59e0b' },
  { name: 'Cancelados', value: 3, color: '#ef4444' },
]

// Top rotas
const topRotas = [
  { rota: 'SP → RJ', viagens: 15, faturamento: 36750 },
  { rota: 'SP → PR', viagens: 12, faturamento: 31200 },
  { rota: 'MG → SP', viagens: 10, faturamento: 28500 },
  { rota: 'PR → SC', viagens: 8, faturamento: 18400 },
  { rota: 'SP → MG', viagens: 6, faturamento: 15600 },
]

// Tipos de carga
const tiposCarga = [
  { name: 'Eletrônicos', value: 25, color: '#2BBCB3' },
  { name: 'Mudanças', value: 20, color: '#F5921B' },
  { name: 'Mat. Construção', value: 18, color: '#3b82f6' },
  { name: 'Alimentos', value: 15, color: '#10b981' },
  { name: 'Peças Auto', value: 12, color: '#8b5cf6' },
  { name: 'Outros', value: 10, color: '#6b7280' },
]

// Desempenho semanal
const desempenhoSemanal = [
  { dia: 'Seg', entregas: 3, km: 1200 },
  { dia: 'Ter', entregas: 2, km: 850 },
  { dia: 'Qua', entregas: 4, km: 1800 },
  { dia: 'Qui', entregas: 1, km: 430 },
  { dia: 'Sex', entregas: 5, km: 2100 },
  { dia: 'Sáb', entregas: 2, km: 900 },
  { dia: 'Dom', entregas: 0, km: 0 },
]

// Avaliações
const avaliacaoData = [
  { name: '5 estrelas', value: 28, fill: '#2BBCB3' },
  { name: '4 estrelas', value: 12, fill: '#10b981' },
  { name: '3 estrelas', value: 3, fill: '#f59e0b' },
  { name: '2 estrelas', value: 1, fill: '#ef4444' },
]

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold text-brand-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <strong>{typeof entry.value === 'number' && entry.name?.includes('R$') 
              ? `R$ ${entry.value.toLocaleString('pt-BR')}` 
              : entry.value.toLocaleString('pt-BR')}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'ano'>('mes')

  // KPIs calculados
  const faturamentoTotal = faturamentoMensal.reduce((acc, m) => acc + m.valor, 0)
  const faturamentoMesAtual = faturamentoMensal[faturamentoMensal.length - 1].valor
  const faturamentoMesAnterior = faturamentoMensal[faturamentoMensal.length - 2].valor
  const variacaoFaturamento = ((faturamentoMesAtual - faturamentoMesAnterior) / faturamentoMesAnterior * 100).toFixed(1)
  const totalCotacoes = faturamentoMensal.reduce((acc, m) => acc + m.cotacoes, 0)
  const totalContratacoes = cotacoesVsContratacoes.reduce((acc, m) => acc + m.contratacoes, 0)
  const taxaConversao = ((totalContratacoes / cotacoesVsContratacoes.reduce((acc, m) => acc + m.cotacoes, 0)) * 100).toFixed(1)
  const mediaAvaliacao = (
    (28 * 5 + 12 * 4 + 3 * 3 + 1 * 2) / (28 + 12 + 3 + 1)
  ).toFixed(1)

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand-800">Dashboard</h2>
          <p className="text-muted-foreground">Panorama geral da sua transportadora</p>
        </div>
        <div className="flex rounded-xl bg-brand-50 p-1 border border-brand-100">
          {[
            { key: 'semana' as const, label: '7 dias' },
            { key: 'mes' as const, label: '30 dias' },
            { key: 'ano' as const, label: '12 meses' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                periodo === p.key
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-muted-foreground hover:text-brand-600'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <span className={cn(
                'text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full',
                Number(variacaoFaturamento) >= 0 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-red-700 bg-red-50'
              )}>
                {Number(variacaoFaturamento) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(Number(variacaoFaturamento))}%
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              R$ {(faturamentoMesAtual / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Faturamento do mês</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Eye className="h-5 w-5 text-brand-600" />
              </div>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> 12%
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalCotacoes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cotações recebidas</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{taxaConversao}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Taxa de conversão</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{mediaAvaliacao}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avaliação média</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Faturamento + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Faturamento */}
        <Card className="border-brand-100 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-brand-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-500" />
                  Faturamento
                </CardTitle>
                <CardDescription>Evolução mensal do faturamento</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-800">
                  R$ {(faturamentoTotal / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">Total 12 meses</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 288 }}>
              <ResponsiveContainer width="100%" height={288} minWidth={0}>
                <AreaChart data={faturamentoMensal}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2BBCB3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2BBCB3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="#9ca3af"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    name="R$ Faturamento"
                    stroke="#2BBCB3"
                    strokeWidth={3}
                    fill="url(#colorFaturamento)"
                    dot={{ fill: '#2BBCB3', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Fretes (Donut) */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-orange-500" />
              Status dos Fretes
            </CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 208 }}>
              <ResponsiveContainer width="100%" height={208} minWidth={0}>
                <PieChart>
                  <Pie
                    data={statusFretes}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusFretes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {statusFretes.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-bold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Cotações vs Contratações + Tipos de Carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cotações vs Contratações */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-500" />
              Cotações vs Contratações
            </CardTitle>
            <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 256 }}>
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={cotacoesVsContratacoes} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="cotacoes" name="Cotações" fill="#2BBCB3" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contratacoes" name="Contratações" fill="#F5921B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Carga */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Tipos de Carga
            </CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 208 }}>
              <ResponsiveContainer width="100%" height={208} minWidth={0}>
                <PieChart>
                  <Pie
                    data={tiposCarga}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tiposCarga.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {tiposCarga.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Top Rotas + Desempenho Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Rotas */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Route className="h-5 w-5 text-brand-500" />
              Top 5 Rotas
            </CardTitle>
            <CardDescription>Rotas com maior volume de viagens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRotas.map((rota, index) => {
                const maxViagens = topRotas[0].viagens
                const porcentagem = (rota.viagens / maxViagens) * 100
                return (
                  <div key={rota.rota} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-brand-500 text-white' :
                          index === 1 ? 'bg-brand-200 text-brand-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-brand-800 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-brand-400" />
                          {rota.rota}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-brand-700">{rota.viagens} viagens</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          R$ {(rota.faturamento / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Desempenho Semanal */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Desempenho Semanal
            </CardTitle>
            <CardDescription>Entregas e quilometragem por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 256 }}>
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={desempenhoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar yAxisId="left" dataKey="entregas" name="Entregas" fill="#2BBCB3" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="km" name="Km rodados" stroke="#F5921B" strokeWidth={2} dot={{ fill: '#F5921B', r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Avaliações + Resumo Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avaliações */}
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Avaliações
            </CardTitle>
            <CardDescription>Satisfação dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-5xl font-black text-brand-800">{mediaAvaliacao}</p>
              <div className="flex justify-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={cn(
                    'h-5 w-5',
                    star <= Math.round(Number(mediaAvaliacao)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                  )} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">44 avaliações</p>
            </div>
            <div className="space-y-2">
              {avaliacaoData.map((item) => {
                const total = avaliacaoData.reduce((acc, i) => acc + i.value, 0)
                const pct = ((item.value / total) * 100).toFixed(0)
                return (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{item.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                    </div>
                    <span className="font-bold w-8 text-right">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Rápido */}
        <Card className="border-brand-100 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-500" />
              Indicadores de Performance
            </CardTitle>
            <CardDescription>Métricas chave do seu negócio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-brand-500" />
                  <span className="text-xs text-muted-foreground">Tempo Médio Entrega</span>
                </div>
                <p className="text-2xl font-black text-brand-800">2.4 dias</p>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> 8% mais rápido
                </span>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Km Rodados (mês)</span>
                </div>
                <p className="text-2xl font-black text-orange-700">12.450</p>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> 15% a mais
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Taxa de Entrega</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">94.3%</p>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> Excelente
                </span>
              </div>

              <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-brand-500" />
                  <span className="text-xs text-muted-foreground">Ticket Médio</span>
                </div>
                <p className="text-2xl font-black text-brand-800">R$ 2.850</p>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> 5% maior
                </span>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Fretes Ativos</span>
                </div>
                <p className="text-2xl font-black text-orange-700">5</p>
                <span className="text-xs text-muted-foreground">em andamento</span>
              </div>

              <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  <span className="text-xs text-muted-foreground">Rotas Ativas</span>
                </div>
                <p className="text-2xl font-black text-brand-800">7</p>
                <span className="text-xs text-muted-foreground">rotas diferentes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
