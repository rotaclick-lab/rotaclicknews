'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface MonthlyData {
  mes: string
  valor: number
  fretes: number
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DashboardChart({ data }: { data: MonthlyData[] }) {
  const hasData = data.some(d => d.valor > 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
        <span className="text-3xl">📦</span>
        <span>Nenhum gasto registrado ainda</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2BBCB3" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2BBCB3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v === 0 ? '' : `R$${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip
          formatter={(value: number | undefined) => [value != null ? formatCurrency(value) : '—', 'Gasto']}
          labelStyle={{ color: '#475569', fontWeight: 600, fontSize: 12 }}
          contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="#2BBCB3"
          strokeWidth={2.5}
          fill="url(#colorValor)"
          dot={{ r: 3, fill: '#2BBCB3', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#2BBCB3', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
