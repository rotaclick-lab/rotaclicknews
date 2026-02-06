'use client'

import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'

export function FreightFilters() {
  return (
    <Button variant="outline" size="sm">
      <Filter className="mr-2 h-4 w-4" />
      Filtros Avançados
    </Button>
  )
}
