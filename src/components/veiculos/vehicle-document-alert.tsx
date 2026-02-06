'use client'

import { AlertTriangle, FileText, Shield, ClipboardCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'

interface VehicleDocumentAlertProps {
  crlvExpiryDate?: string | null
  ipvaExpiryDate?: string | null
  insuranceExpiryDate?: string | null
  vehiclePlate?: string
}

export function VehicleDocumentAlert({
  crlvExpiryDate,
  ipvaExpiryDate,
  insuranceExpiryDate,
  vehiclePlate,
}: VehicleDocumentAlertProps) {
  const checkExpiry = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring'
    return null
  }

  const crlvStatus = checkExpiry(crlvExpiryDate)
  const ipvaStatus = checkExpiry(ipvaExpiryDate)
  const insuranceStatus = checkExpiry(insuranceExpiryDate)

  const expiredDocs: Array<{ name: string; date: string | null | undefined; icon: typeof FileText }> = []
  const expiringDocs: Array<{ name: string; date: string | null | undefined; icon: typeof FileText }> = []

  if (crlvStatus === 'expired') expiredDocs.push({ name: 'CRLV', date: crlvExpiryDate, icon: FileText })
  if (crlvStatus === 'expiring') expiringDocs.push({ name: 'CRLV', date: crlvExpiryDate, icon: FileText })

  if (ipvaStatus === 'expired') expiredDocs.push({ name: 'IPVA', date: ipvaExpiryDate, icon: ClipboardCheck })
  if (ipvaStatus === 'expiring') expiringDocs.push({ name: 'IPVA', date: ipvaExpiryDate, icon: ClipboardCheck })

  if (insuranceStatus === 'expired') expiredDocs.push({ name: 'Seguro', date: insuranceExpiryDate, icon: Shield })
  if (insuranceStatus === 'expiring') expiringDocs.push({ name: 'Seguro', date: insuranceExpiryDate, icon: Shield })

  if (expiredDocs.length === 0 && expiringDocs.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Expired Documents */}
      {expiredDocs.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Documento(s) Vencido(s)</AlertTitle>
          <AlertDescription>
            {vehiclePlate && `Veículo ${vehiclePlate}: `}
            {expiredDocs.map((doc, index) => {
              const Icon = doc.icon
              return (
                <div key={index} className="flex items-center gap-2 mt-1">
                  <Icon className="h-3 w-3" />
                  <span>
                    <strong>{doc.name}</strong> venceu em {doc.date ? formatDate(doc.date) : 'N/A'}
                  </span>
                </div>
              )
            })}
            <p className="mt-2 text-sm">O veículo não pode ser utilizado até a regularização.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Expiring Documents */}
      {expiringDocs.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Documento(s) Próximo(s) do Vencimento</AlertTitle>
          <AlertDescription className="text-orange-800">
            {vehiclePlate && `Veículo ${vehiclePlate}: `}
            {expiringDocs.map((doc, index) => {
              const Icon = doc.icon
              const daysLeft = Math.ceil(
                (new Date(doc.date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <div key={index} className="flex items-center gap-2 mt-1">
                  <Icon className="h-3 w-3" />
                  <span>
                    <strong>{doc.name}</strong> vence em {doc.date ? formatDate(doc.date) : 'N/A'} ({daysLeft} dia
                    {daysLeft !== 1 ? 's' : ''})
                  </span>
                </div>
              )
            })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
