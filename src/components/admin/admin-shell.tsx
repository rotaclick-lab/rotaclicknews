'use client'

import { AuthProvider, ProtectedRoute } from '@/components/auth/auth-provider'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <div className="hidden lg:flex">
            <AdminSidebar />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminHeader />

            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 lg:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
