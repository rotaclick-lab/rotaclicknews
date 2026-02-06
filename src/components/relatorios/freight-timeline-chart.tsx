'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FreightTimelineChartProps {
  data: Array<{ date: string; count: number; total: number }>
  title?: string
  description?: string
}

export function FreightTimelineChart({ 
  data, 
  title = 'Evolução de Fretes',
  description = 'Quantidade e valor ao longo do tempo'
}: FreightTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    quantidade: item.count,
    valor: item.total,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              style={{ fontSize: '12px' }}
              stroke="currentColor"
            />
            <YAxis 
              yAxisId="left"
              style={{ fontSize: '12px' }}
              stroke="currentColor"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              style={{ fontSize: '12px' }}
              stroke="currentColor"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="quantidade" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Quantidade"
              dot={{ fill: '#3b82f6' }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="valor" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Valor Total"
              dot={{ fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
