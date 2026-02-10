import { RoleGuard } from '@/components/auth/role-guard'

export default function TabelaFreteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRole="transportadora">
      {children}
    </RoleGuard>
  )
}
