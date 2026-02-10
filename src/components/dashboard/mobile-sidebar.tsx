'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-brand-100 px-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center space-x-2">
            <Image src="/logo.png" alt="RotaClick" width={140} height={70} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-muted-foreground hover:bg-brand-50 hover:text-brand-700'
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
  )
}
