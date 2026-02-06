'use client'

import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserNav } from './user-nav'
import { MobileSidebar } from './mobile-sidebar'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Find the current page title from NAV_ITEMS
  const currentPage = NAV_ITEMS.find(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const pageTitle = currentPage?.title || 'Dashboard'

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        {/* Page Title / Breadcrumb */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar fretes, clientes..."
              className="pl-8 w-full"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserNav />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}
