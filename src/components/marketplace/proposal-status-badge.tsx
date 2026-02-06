import { Badge } from '@/components/ui/badge'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS, type ProposalStatus } from '@/types/marketplace.types'

interface ProposalStatusBadgeProps {
  status: ProposalStatus
}

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  return (
    <Badge className={PROPOSAL_STATUS_COLORS[status]} variant="outline">
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  )
}
