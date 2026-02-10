import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listNotifications, markAllAsRead } from '@/app/actions/notification-actions'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react'
import { NOTIFICATION_TYPE_LABELS } from '@/types/notification.types'

export const dynamic = 'force-dynamic'

export default async function NotificacoesPage() {
  const result = await listNotifications(50, false)
  const notifications = result.success && result.data ? result.data : []

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas notificações
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <form action={markAllAsRead}>
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          </form>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todas
            <Badge variant="secondary">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Não lidas
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive">{unreadNotifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-2">
            Lidas
            <Badge variant="secondary">{readNotifications.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationList notifications={notifications} />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationList notifications={unreadNotifications} />
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <NotificationList notifications={readNotifications} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationList({ notifications }: { notifications: any[] }) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-muted-foreground">
              Você não possui notificações nesta categoria
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={!notification.read ? 'border-brand-200 bg-brand-50/50' : ''}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  {!notification.read && (
                    <Badge variant="destructive" className="h-5">Novo</Badge>
                  )}
                </div>
                <CardDescription>
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {NOTIFICATION_TYPE_LABELS[notification.type as keyof typeof NOTIFICATION_TYPE_LABELS] || notification.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {notification.message}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {notification.link && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={notification.link}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {!notification.read && (
                  <Button size="sm" variant="ghost">
                    <Check className="mr-2 h-4 w-4" />
                    Marcar como lida
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
