import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'transportadora' | 'cliente' | 'admin'
}

type Role = 'owner' | 'admin' | 'manager' | 'driver' | 'client' | 'transportadora' | 'cliente'

const normalizeRole = (role: string | null | undefined): Role | null => {
  if (!role) return null

  if (role === 'transportadora') return 'owner'
  if (role === 'cliente') return 'client'

  return role as Role
}

const allowedRolesByPage: Record<RoleGuardProps['allowedRole'], Role[]> = {
  transportadora: ['owner', 'admin', 'manager', 'driver'],
  cliente: ['client'],
  admin: ['admin'],
}

export async function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let role: Role | null = null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileError && profile?.role) {
    role = normalizeRole(profile.role)
  }

  if (!role) {
    const { data: userRow, error: usersError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!usersError && userRow?.role) {
      role = normalizeRole(userRow.role)
    }
  }

  const allowedRoles = allowedRolesByPage[allowedRole]

  if (!role || !allowedRoles.includes(role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
