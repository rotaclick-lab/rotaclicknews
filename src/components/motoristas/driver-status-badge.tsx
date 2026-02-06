'use client'

import { Badge } from '@/components/ui/badge'
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_COLORS, type DriverStatus } from '@/types/driver.types'
import { cn } from '@/lib/utils'

interface DriverStatusBadgeProps {
  status: DriverStatus
  className?: string
}

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        DRIVER_STATUS_COLORS[status],
        className
      )}
    >
      {DRIVER_STATUS_LABELS[status]}
    </Badge>
  )
}
