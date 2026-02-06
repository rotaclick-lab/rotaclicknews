'use client'

import { Badge } from '@/components/ui/badge'
import { FREIGHT_STATUS_LABELS, FREIGHT_STATUS_COLORS, type FreightStatus } from '@/types/freight.types'
import { cn } from '@/lib/utils'

interface FreightStatusBadgeProps {
  status: FreightStatus
  className?: string
}

export function FreightStatusBadge({ status, className }: FreightStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        FREIGHT_STATUS_COLORS[status],
        className
      )}
    >
      {FREIGHT_STATUS_LABELS[status]}
    </Badge>
  )
}
