'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionStatusBadge } from './transaction-status-badge'
import { TransactionTypeBadge } from './transaction-type-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, FileText, CreditCard, Building2, User, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { TransactionWithRelations } from '@/types/financial.types'
import { PAYMENT_METHOD_LABELS } from '@/types/financial.types'

interface TransactionCardProps {
  transaction: TransactionWithRelations
  onMarkAsPaid?: (id: string) => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TransactionCard({ 
  transaction, 
  onMarkAsPaid,
  onCancel,
  onDelete 
}: TransactionCardProps) {
  const isIncome = transaction.type === 'income'
  const isPending = transaction.status === 'pending'
  const isOverdue = transaction.status === 'overdue'

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <TransactionTypeBadge type={transaction.type as any} />
              <TransactionStatusBadge status={transaction.status as any} />
            </div>
            <h3 className="font-semibold text-lg">{transaction.description}</h3>
            {transaction.transaction_categories && (
              <Badge variant="secondary" style={{ 
                backgroundColor: transaction.transaction_categories.color || '#e5e7eb',
                color: '#000'
              }}>
                {transaction.transaction_categories.name}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/financeiro/transacoes/${transaction.id}`}>
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              {isPending && onMarkAsPaid && (
                <DropdownMenuItem onClick={() => onMarkAsPaid(transaction.id)}>
                  Marcar como Pago
                </DropdownMenuItem>
              )}
              {isPending && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(transaction.id)}>
                  Cancelar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(transaction.id)}
                  className="text-red-600"
                >
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor</span>
            <span className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Vencimento</p>
                <p className="font-medium">{formatDate(transaction.due_date)}</p>
              </div>
            </div>
            {transaction.payment_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{formatDate(transaction.payment_date)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          {transaction.payment_method && PAYMENT_METHOD_LABELS[transaction.payment_method as keyof typeof PAYMENT_METHOD_LABELS] && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Forma de pagamento:</span>
              <span className="font-medium">{PAYMENT_METHOD_LABELS[transaction.payment_method as keyof typeof PAYMENT_METHOD_LABELS]}</span>
            </div>
          )}

          {/* Customer */}
          {transaction.customers && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{transaction.customers.name}</span>
            </div>
          )}

          {/* Supplier */}
          {transaction.supplier_name && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fornecedor:</span>
              <span className="font-medium">{transaction.supplier_name}</span>
            </div>
          )}

          {/* Freight */}
          {transaction.freights && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Frete:</span>
              <Link 
                href={`/fretes/${transaction.freights.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {transaction.freights.freight_number}
              </Link>
            </div>
          )}

          {/* Reference Number */}
          {transaction.reference_number && (
            <div className="text-sm">
              <span className="text-muted-foreground">Referência: </span>
              <span className="font-medium">{transaction.reference_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
