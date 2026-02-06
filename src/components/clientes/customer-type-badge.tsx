'use client'

import { Badge } from '@/components/ui/badge'
import { CUSTOMER_TYPE_LABELS, type CustomerType } from '@/types/customer.types'
import { Building2, User } from 'lucide-react'

interface CustomerTypeBadgeProps {
  type: CustomerType
  className?: string
}

export function CustomerTypeBadge({ type, className }: CustomerTypeBadgeProps) {
  const Icon = type === 'company' ? Building2 : User
  
  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {CUSTOMER_TYPE_LABELS[type]}
    </Badge>
  )
}
