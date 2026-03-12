import { RoleGuard } from '@/components/auth/role-guard'
import { ClienteSidebar } from './cliente-sidebar'

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRole="cliente">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex">
        <ClienteSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </RoleGuard>
  )
}
