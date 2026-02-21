'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminUserNav } from './admin-user-nav'
import { usePathname } from 'next/navigation'
import { ADMIN_NAV_ITEMS } from '@/lib/constants'
import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function AdminHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentPage = ADMIN_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const pageTitle = currentPage?.title || 'Administração'

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>

          <AdminUserNav />
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-900">
          <div className="flex h-16 items-center border-b border-slate-700 px-4">
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
                A
              </div>
              <span className="font-bold text-white">Admin</span>
            </Link>
          </div>
          <nav className="space-y-1 p-4">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
