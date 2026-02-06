'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { CategoryStats } from '@/types/financial.types'

interface CategoryChartProps {
  data: CategoryStats[]
  title: string
  description: string
  type: 'income' | 'expense'
}

export function CategoryChart({ data, title, description, type }: CategoryChartProps) {
  if (data.length === 0) {
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

  const total = data.reduce((sum, item) => sum + item.total_amount, 0)
  const colors = type === 'income' 
    ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']
    : ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className={`text-3xl font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(total)}
          </p>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.category_id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="font-medium">{item.category_name}</span>
                  <span className="text-muted-foreground">
                    ({item.transaction_count})
                  </span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(item.total_amount)}
                </span>
              </div>
              
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                />
              </div>
              
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <div className="flex gap-1 h-4 w-full max-w-md rounded-full overflow-hidden">
            {data.map((item, index) => (
              <div
                key={item.category_id}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: colors[index % colors.length],
                }}
                title={`${item.category_name}: ${item.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
