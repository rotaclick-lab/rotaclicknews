'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { LayoutDashboard, Package, HeadphonesIcon, UserCircle, Plus, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth-actions'

const NAV = [
  { label: 'Painel',     href: '/cliente',           icon: LayoutDashboard },
  { label: 'Histórico',  href: '/cliente/historico',  icon: Package },
  { label: 'Suporte',    href: '/cliente/suporte',    icon: HeadphonesIcon },
  { label: 'Meu Perfil', href: '/cliente/perfil',     icon: UserCircle },
]

export function ClienteSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-slate-200 bg-white min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href="/cliente">
            <Logo width={120} height={38} className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Nova cotação CTA */}
        <div className="px-4 py-3">
          <Link
            href="/cliente/cotacao"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova Cotação
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/cliente' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sair */}
        <div className="px-3 pb-5 border-t border-slate-100 pt-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1 safe-bottom">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/cliente' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <Link
          href="/cliente/cotacao"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-brand-500"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-medium">Cotar</span>
        </Link>
      </nav>
    </>
  )
}
