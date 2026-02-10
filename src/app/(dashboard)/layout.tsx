'use client'

import { AuthProvider, ProtectedRoute } from '@/components/auth/auth-provider'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {/* Sidebar Desktop */}
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <Header />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 lg:p-8">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
