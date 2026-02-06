import { Badge } from '@/components/ui/badge'
import { TRANSACTION_TYPE_LABELS } from '@/types/financial.types'
import type { TransactionTypeEnum } from '@/types/financial.types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TransactionTypeBadgeProps {
  type: TransactionTypeEnum
  className?: string
}

export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  const isIncome = type === 'income'
  
  return (
    <Badge 
      variant="outline" 
      className={`${isIncome ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'} ${className}`}
    >
      {isIncome ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
      {TRANSACTION_TYPE_LABELS[type]}
    </Badge>
  )
}
