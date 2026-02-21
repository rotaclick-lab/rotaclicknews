'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_ITEMS, APP_NAME } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'relative flex h-screen flex-col border-r border-slate-200 bg-slate-900 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b border-slate-700 px-4">
        {!collapsed ? (
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
              A
            </div>
            <span className="font-bold text-white">Admin</span>
          </Link>
        ) : (
          <Link href="/admin" className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
              A
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
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

      <div className="border-t border-slate-700 p-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full hover:bg-slate-800 text-slate-300 hover:text-white', collapsed && 'px-2')}
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
