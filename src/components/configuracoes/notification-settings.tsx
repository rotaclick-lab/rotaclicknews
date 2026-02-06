'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateNotificationSettings } from '@/app/actions/settings-actions'

interface NotificationSettingsProps {
  settings: any
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [emailNotifications, setEmailNotifications] = useState(settings.email_notifications ?? true)
  const [freightUpdates, setFreightUpdates] = useState(settings.freight_updates ?? true)
  const [paymentReminders, setPaymentReminders] = useState(settings.payment_reminders ?? true)
  const [documentExpiration, setDocumentExpiration] = useState(settings.document_expiration ?? true)
  const [newMarketplaceRoutes, setNewMarketplaceRoutes] = useState(settings.new_marketplace_routes ?? false)
  const [proposalUpdates, setProposalUpdates] = useState(settings.proposal_updates ?? true)
  const [systemUpdates, setSystemUpdates] = useState(settings.system_updates ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await updateNotificationSettings({
      email_notifications: emailNotifications,
      freight_updates: freightUpdates,
      payment_reminders: paymentReminders,
      document_expiration: documentExpiration,
      new_marketplace_routes: newMarketplaceRoutes,
      proposal_updates: proposalUpdates,
      system_updates: systemUpdates,
    })

    if (result.success) {
      toast.success('Preferências de notificação atualizadas!')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao atualizar notificações')
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Configure como deseja receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações por email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Atualizações de Fretes</Label>
              <p className="text-sm text-muted-foreground">
                Mudanças de status dos fretes
              </p>
            </div>
            <Switch
              checked={freightUpdates}
              onCheckedChange={setFreightUpdates}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes de Pagamento</Label>
              <p className="text-sm text-muted-foreground">
                Alertas de vencimentos
              </p>
            </div>
            <Switch
              checked={paymentReminders}
              onCheckedChange={setPaymentReminders}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vencimento de Documentos</Label>
              <p className="text-sm text-muted-foreground">
                CNH, CRLV e outros documentos
              </p>
            </div>
            <Switch
              checked={documentExpiration}
              onCheckedChange={setDocumentExpiration}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Novas Rotas no Marketplace</Label>
              <p className="text-sm text-muted-foreground">
                Quando novas rotas forem publicadas
              </p>
            </div>
            <Switch
              checked={newMarketplaceRoutes}
              onCheckedChange={setNewMarketplaceRoutes}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Atualizações de Propostas</Label>
              <p className="text-sm text-muted-foreground">
                Status das suas propostas
              </p>
            </div>
            <Switch
              checked={proposalUpdates}
              onCheckedChange={setProposalUpdates}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Atualizações do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Novidades e manutenções
              </p>
            </div>
            <Switch
              checked={systemUpdates}
              onCheckedChange={setSystemUpdates}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
