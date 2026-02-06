'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { CashFlowData } from '@/types/financial.types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface CashFlowChartProps {
  data: CashFlowData[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Entradas e saídas do período</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense)),
    1000
  )

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0)
  const balance = totalIncome - totalExpense

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Entradas e saídas do período</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {data.slice(0, 10).map((item, index) => {
              const date = new Date(item.date)
              const dateStr = date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dateStr}</span>
                    <span className={`font-semibold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.balance)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-8">
                    <div 
                      className="bg-green-500 rounded transition-all hover:bg-green-600"
                      style={{ 
                        width: `${(item.income / maxValue) * 100}%`,
                        minWidth: item.income > 0 ? '2%' : '0'
                      }}
                      title={`Receita: ${formatCurrency(item.income)}`}
                    />
                    <div 
                      className="bg-red-500 rounded transition-all hover:bg-red-600"
                      style={{ 
                        width: `${(item.expense / maxValue) * 100}%`,
                        minWidth: item.expense > 0 ? '2%' : '0'
                      }}
                      title={`Despesa: ${formatCurrency(item.expense)}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Despesas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
