import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSettings } from '@/components/configuracoes/profile-settings'
import { CompanySettings } from '@/components/configuracoes/company-settings'
import { NotificationSettings } from '@/components/configuracoes/notification-settings'
import { SecuritySettings } from '@/components/configuracoes/security-settings'
import { getUserProfile, getCompanySettings, getNotificationSettings } from '@/app/actions/settings-actions'
import { User, Building2, Bell, Shield } from 'lucide-react'

export default async function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da empresa
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Suspense fallback={<SettingsSkeleton />}>
            <ProfileSettingsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Suspense fallback={<SettingsSkeleton />}>
            <CompanySettingsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Suspense fallback={<SettingsSkeleton />}>
            <NotificationSettingsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Suspense fallback={<SettingsSkeleton />}>
            <SecuritySettingsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function ProfileSettingsContent() {
  const result = await getUserProfile()

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    )
  }

  return <ProfileSettings profile={result.data} />
}

async function CompanySettingsContent() {
  const result = await getCompanySettings()

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    )
  }

  return <CompanySettings company={result.data} />
}

async function NotificationSettingsContent() {
  const result = await getNotificationSettings()

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    )
  }

  return <NotificationSettings settings={result.data} />
}

async function SecuritySettingsContent() {
  return <SecuritySettings />
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}
