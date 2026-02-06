'use client'

import { Badge } from '@/components/ui/badge'
import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_COLORS, type VehicleStatus } from '@/types/vehicle.types'
import { cn } from '@/lib/utils'

interface VehicleStatusBadgeProps {
  status: VehicleStatus
  className?: string
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        VEHICLE_STATUS_COLORS[status],
        className
      )}
    >
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  )
}
