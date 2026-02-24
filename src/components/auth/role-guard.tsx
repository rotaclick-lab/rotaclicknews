import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'transportadora' | 'cliente' | 'admin'
}

export async function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? `/${allowedRole === 'admin' ? 'admin' : 'dashboard'}`
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== allowedRole) {
    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'cliente') redirect('/cliente')
    redirect('/dashboard')
  }

  return <>{children}</>
}
