'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, TrendingUp, DollarSign, Route, Truck, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getCarrierDashboardStats } from '@/app/actions/quotes-actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981', pending: '#f59e0b', cancelled: '#ef4444',
  expired: '#6b7280', failed: '#ef4444', in_progress: '#2BBCB3',
}
const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado',
  expired: 'Expirado', failed: 'Falhou', in_progress: 'Em andamento',
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const desempenhoSemanal = [
  { dia: 'Seg', fretes: 3 }, { dia: 'Ter', fretes: 2 }, { dia: 'Qua', fretes: 4 },
  { dia: 'Qui', fretes: 1 }, { dia: 'Sex', fretes: 5 }, { dia: 'Sáb', fretes: 2 }, { dia: 'Dom', fretes: 0 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold text-brand-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <strong>{entry.value?.toLocaleString('pt-BR')}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCarrierDashboardStats().then(res => {
      if (res.success) setStats(res.data)
      else setError(res.error ?? 'Erro ao carregar dados')
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    )
  }

  const monthlyData = stats?.monthlyData ?? []
  const statusBreakdown = (stats?.statusBreakdown ?? []).map((s: any) => ({
    ...s,
    color: STATUS_COLORS[s.name] ?? '#6b7280',
    label: STATUS_LABELS[s.name] ?? s.name,
  }))
  const totalRevenue = stats?.totalRevenue ?? 0
  const lastMonth = monthlyData[monthlyData.length - 1]?.valor ?? 0
  const prevMonth = monthlyData[monthlyData.length - 2]?.valor ?? 0
  const variacaoFaturamento = prevMonth > 0 ? (((lastMonth - prevMonth) / prevMonth) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand-800">Dashboard</h2>
          <p className="text-muted-foreground">Panorama geral da sua transportadora</p>
        </div>
        <div className="flex gap-2">
          <Link href="/cotacoes-recebidas">
            <Button variant="outline" size="sm" className="border-brand-200 text-brand-700">Ver cotações</Button>
          </Link>
          <Link href="/tabela-frete">
            <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white">Gerenciar tabela</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                Number(variacaoFaturamento) >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}>
                {Number(variacaoFaturamento) >= 0 ? '↑' : '↓'} {Math.abs(Number(variacaoFaturamento))}%
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">{fmt(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Faturamento total</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="p-2.5 rounded-xl bg-brand-100 w-fit mb-3">
              <Eye className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats?.quotesReceived ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cotações recebidas</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="p-2.5 rounded-xl bg-orange-100 w-fit mb-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats?.conversionRate ?? 0}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Taxa de conversão</p>
          </CardContent>
        </Card>

        <Card className="border-brand-100 hover:shadow-md transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-100 w-fit mb-3">
              <Route className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats?.totalRoutes ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Rotas cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Faturamento + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-brand-100 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-brand-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-500" />
                Faturamento mensal
              </CardTitle>
              <p className="text-xl font-black text-brand-800">{fmt(totalRevenue)}</p>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <TrendingUp className="h-10 w-10 text-slate-200" />
                <p className="text-sm text-muted-foreground">Nenhum dado de faturamento ainda.</p>
                <Link href="/tabela-frete">
                  <Button size="sm" variant="outline">Importar tabela de frete</Button>
                </Link>
              </div>
            ) : (
              <div style={{ width: '100%', minHeight: 288 }}>
                <ResponsiveContainer width="100%" height={288} minWidth={0}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2BBCB3" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2BBCB3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="valor" name="R$ Faturamento" stroke="#2BBCB3" strokeWidth={3} fill="url(#colorFaturamento)" dot={{ fill: '#2BBCB3', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Status dos Fretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Truck className="h-8 w-8 text-slate-200" />
                <p className="text-xs text-muted-foreground text-center">Nenhum frete registrado ainda.</p>
              </div>
            ) : (
              <>
                <div style={{ width: '100%', minHeight: 180 }}>
                  <ResponsiveContainer width="100%" height={180} minWidth={0}>
                    <PieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {statusBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusBreakdown.map((item: any) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.label}</span>
                      <span className="font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fretes por mês + Desempenho semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-500" />
              Fretes por mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
              </div>
            ) : (
              <div style={{ width: '100%', minHeight: 240 }}>
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" iconSize={8} />
                    <Bar dataKey="fretes" name="Fretes" fill="#2BBCB3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-800 flex items-center gap-2">
              <Route className="h-5 w-5 text-orange-500" />
              Atividade semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', minHeight: 240 }}>
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart data={desempenhoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fretes" name="Fretes" fill="#F5921B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo rápido */}
      <Card className="border-brand-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-brand-800">Resumo da operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl p-4 border border-brand-100">
              <p className="text-xs text-muted-foreground mb-1">Total de fretes</p>
              <p className="text-2xl font-black text-brand-800">{stats?.totalFreights ?? 0}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-muted-foreground mb-1">Fretes pagos</p>
              <p className="text-2xl font-black text-emerald-700">{stats?.paidFreights ?? 0}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100">
              <p className="text-xs text-muted-foreground mb-1">Cotações recebidas</p>
              <p className="text-2xl font-black text-orange-700">{stats?.quotesReceived ?? 0}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-muted-foreground mb-1">Rotas ativas</p>
              <p className="text-2xl font-black text-indigo-700">{stats?.totalRoutes ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
