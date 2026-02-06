import { Badge } from '@/components/ui/badge'
import { RETURN_FREIGHT_STATUS_LABELS, RETURN_FREIGHT_STATUS_COLORS, type ReturnFreightStatus } from '@/types/marketplace.types'

interface ReturnFreightStatusBadgeProps {
  status: ReturnFreightStatus
}

export function ReturnFreightStatusBadge({ status }: ReturnFreightStatusBadgeProps) {
  return (
    <Badge className={RETURN_FREIGHT_STATUS_COLORS[status]} variant="outline">
      {RETURN_FREIGHT_STATUS_LABELS[status]}
    </Badge>
  )
}
