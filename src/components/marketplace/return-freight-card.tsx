'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReturnFreightStatusBadge } from './return-freight-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Calendar, Truck, DollarSign, TrendingUp, Package } from 'lucide-react'
import Link from 'next/link'
import type { ReturnFreightWithRelations } from '@/types/marketplace.types'

interface ReturnFreightCardProps {
  returnFreight: ReturnFreightWithRelations
  showActions?: boolean
}

export function ReturnFreightCard({ returnFreight, showActions = true }: ReturnFreightCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {returnFreight.origin_city}/{returnFreight.origin_state}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold">
                {returnFreight.destination_city}/{returnFreight.destination_state}
              </span>
            </div>
            {returnFreight.distance_km && (
              <p className="text-xs text-muted-foreground">
                {returnFreight.distance_km} km
              </p>
            )}
          </div>
          <ReturnFreightStatusBadge status={returnFreight.status as any} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preços */}
        {(returnFreight.suggested_price || returnFreight.best_proposal) && (
          <div className="grid grid-cols-2 gap-2">
            {returnFreight.suggested_price && (
              <div className="p-3 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-brand-600" />
                  <p className="text-xs text-muted-foreground">Sugerido</p>
                </div>
                <p className="text-lg font-bold text-brand-600">
                  {formatCurrency(returnFreight.suggested_price)}
                </p>
              </div>
            )}
            {returnFreight.best_proposal && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-muted-foreground">Melhor</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(returnFreight.best_proposal)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{returnFreight.vehicle_type}</p>
              {returnFreight.vehicles && (
                <p className="text-xs text-muted-foreground">{returnFreight.vehicles.plate}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm">
                Disponível: {formatDate(returnFreight.available_date)}
              </p>
            </div>
          </div>

          {returnFreight.cargo_type && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{returnFreight.cargo_type}</p>
            </div>
          )}
        </div>

        {/* Propostas */}
        {returnFreight.proposals_count !== undefined && returnFreight.proposals_count > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Propostas</span>
              <Badge variant="secondary">{returnFreight.proposals_count}</Badge>
            </div>
          </div>
        )}

        {/* Company */}
        {returnFreight.companies && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Anunciante: <span className="font-medium">{returnFreight.companies.name}</span>
            </p>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/marketplace/${returnFreight.id}`}>
              Ver Detalhes
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
