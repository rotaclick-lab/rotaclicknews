import { RoleGuard } from '@/components/auth/role-guard'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRole="transportadora">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  )
}
