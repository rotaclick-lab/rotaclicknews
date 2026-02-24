import { RoleGuard } from '@/components/auth/role-guard'

export default function PageBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRole="admin">
      <div className="h-screen overflow-hidden">{children}</div>
    </RoleGuard>
  )
}
