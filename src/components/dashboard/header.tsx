'use client'

import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserNav } from './user-nav'
import { MobileSidebar } from './mobile-sidebar'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const fetchCompany = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      if (!profile?.company_id) return
      const { data: company } = await supabase
        .from('companies')
        .select('nome_fantasia, razao_social, name')
        .eq('id', profile.company_id)
        .single()
      if (company) {
        setCompanyName(company.nome_fantasia || company.razao_social || company.name || null)
      }
    }
    fetchCompany()
  }, [user])

  // Find the current page title from NAV_ITEMS
  const currentPage = NAV_ITEMS.find(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const pageTitle = currentPage?.title || 'Dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white">
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

        {/* Company Name + Page Title */}
        <div className="flex-1 flex flex-col min-w-0 justify-center">
          {companyName ? (
            <>
              <p className="text-lg font-semibold text-brand-800 truncate leading-tight">
                {companyName}
              </p>
              <h1 className="text-xs font-medium text-muted-foreground truncate">
                {pageTitle}
              </h1>
            </>
          ) : (
            <h1 className="text-lg font-semibold text-brand-800">{pageTitle}</h1>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar fretes, clientes..."
              className="pl-8 w-full focus-visible:ring-brand-500"
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
