import { Badge } from '@/components/ui/badge'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS } from '@/types/financial.types'
import type { TransactionStatus } from '@/types/financial.types'

interface TransactionStatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export function TransactionStatusBadge({ status, className }: TransactionStatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${TRANSACTION_STATUS_COLORS[status]} ${className}`}
    >
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  )
}
