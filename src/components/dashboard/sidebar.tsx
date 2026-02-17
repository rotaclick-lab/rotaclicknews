'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'relative flex h-screen flex-col border-r border-brand-100 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-brand-100 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="RotaClick" width={160} height={50} className="h-10 w-auto object-contain" priority />
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <span className="text-lg font-bold">R</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-muted-foreground hover:bg-brand-50 hover:text-brand-700',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Collapse Button */}
      <div className="border-t border-brand-100 p-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full hover:bg-brand-50 hover:text-brand-700', collapsed && 'px-2')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Recolher
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
