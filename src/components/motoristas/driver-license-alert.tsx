'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'

interface DriverLicenseAlertProps {
  expiryDate: string | null
  driverName?: string
}

export function DriverLicenseAlert({ expiryDate, driverName }: DriverLicenseAlertProps) {
  if (!expiryDate) return null

  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Already expired
  if (daysUntilExpiry < 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>CNH Vencida</AlertTitle>
        <AlertDescription>
          {driverName ? `A CNH de ${driverName}` : 'A CNH'} venceu em{' '}
          {formatDate(expiryDate)}. O motorista não pode realizar entregas.
        </AlertDescription>
      </Alert>
    )
  }

  // Expiring in 30 days
  if (daysUntilExpiry <= 30) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">CNH Próxima do Vencimento</AlertTitle>
        <AlertDescription className="text-orange-800">
          {driverName ? `A CNH de ${driverName}` : 'A CNH'} vence em{' '}
          {formatDate(expiryDate)} ({daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}).
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
