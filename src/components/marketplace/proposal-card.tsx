'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProposalStatusBadge } from './proposal-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Building2, DollarSign } from 'lucide-react'
import type { ProposalWithRelations } from '@/types/marketplace.types'
import { acceptProposal, rejectProposal } from '@/app/actions/proposal-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProposalCardProps {
  proposal: ProposalWithRelations
  showActions?: boolean
  isOwner?: boolean
}

export function ProposalCard({ proposal, showActions = true, isOwner = false }: ProposalCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    const result = await acceptProposal(proposal.id)
    
    if (result.success) {
      toast.success('Proposta aceita com sucesso!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao aceitar proposta')
    }
    setIsLoading(false)
  }

  const handleReject = async () => {
    setIsLoading(true)
    const result = await rejectProposal(proposal.id)
    
    if (result.success) {
      toast.success('Proposta recusada')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao recusar proposta')
    }
    setIsLoading(false)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{proposal.companies?.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enviada em {formatDate(proposal.created_at)}
            </p>
          </div>
          <ProposalStatusBadge status={proposal.status as any} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-brand-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-brand-600" />
            <p className="text-xs text-muted-foreground">Valor Proposto</p>
          </div>
          <p className="text-2xl font-bold text-brand-600">
            {formatCurrency(proposal.proposed_price)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Prazo</p>
            <p className="text-sm font-medium">{proposal.estimated_delivery_days} dias</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Válida até</p>
            <p className="text-sm font-medium">{formatDate(proposal.valid_until)}</p>
          </div>
        </div>

        {proposal.message && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
            <p className="text-sm">{proposal.message}</p>
          </div>
        )}
      </CardContent>

      {showActions && isOwner && proposal.status === 'pending' && (
        <CardFooter className="flex gap-2">
          <Button onClick={handleAccept} disabled={isLoading} className="flex-1">
            Aceitar
          </Button>
          <Button onClick={handleReject} disabled={isLoading} variant="outline" className="flex-1">
            Recusar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
