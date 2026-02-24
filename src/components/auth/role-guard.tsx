import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'transportadora' | 'cliente' | 'admin'
}

export async function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('[RoleGuard] allowedRole:', allowedRole)
  console.log('[RoleGuard] user:', user?.id ?? 'null', '| authError:', authError?.message ?? 'none')

  if (!user) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? `/${allowedRole === 'admin' ? 'admin' : 'dashboard'}`
    console.log('[RoleGuard] sem usuario → redirect /login?next=', pathname)
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[RoleGuard] profile.role:', profile?.role ?? 'null', '| profileError:', profileError?.message ?? 'none')

  if (!profile || profile.role !== allowedRole) {
    console.log('[RoleGuard] role mismatch → esperado:', allowedRole, '| encontrado:', profile?.role ?? 'null')
    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'cliente') redirect('/cliente')
    redirect('/dashboard')
  }

  return <>{children}</>
}
