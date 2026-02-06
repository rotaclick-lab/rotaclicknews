'use client'

import { Badge } from '@/components/ui/badge'
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_COLORS, type CustomerStatus } from '@/types/customer.types'
import { cn } from '@/lib/utils'

interface CustomerStatusBadgeProps {
  status: CustomerStatus
  className?: string
}

export function CustomerStatusBadge({ status, className }: CustomerStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        CUSTOMER_STATUS_COLORS[status],
        className
      )}
    >
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  )
}
