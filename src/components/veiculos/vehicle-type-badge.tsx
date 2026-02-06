'use client'

import { Badge } from '@/components/ui/badge'
import { VEHICLE_TYPE_LABELS, type VehicleType } from '@/types/vehicle.types'
import { Truck, Bus, Container, Package, Car, Bike, type LucideIcon } from 'lucide-react'

interface VehicleTypeBadgeProps {
  type: VehicleType
  className?: string
}

export function VehicleTypeBadge({ type, className }: VehicleTypeBadgeProps) {
  const icons: Record<VehicleType, LucideIcon> = {
    truck: Truck,
    van: Bus,
    semi_trailer: Container,
    trailer: Package,
    pickup: Car,
    motorcycle: Bike,
  }
  
  const Icon = icons[type] || Truck
  
  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {VEHICLE_TYPE_LABELS[type]}
    </Badge>
  )
}
