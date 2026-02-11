import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'transportadora' | 'cliente' | 'admin'
}

type Role =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'driver'
  | 'client'
  | 'transportadora'
  | 'cliente'
  | 'user'

const normalizeRole = (role: string | null | undefined): Role | null => {
  if (!role) return null

  if (role === 'transportadora') return 'owner'
  if (role === 'cliente') return 'client'

  return role as Role
}

const carrierRoles: Role[] = ['owner', 'admin', 'manager', 'driver']

const hasTransportadoraAccess = ({
  role,
  companyId,
}: {
  role: Role | null
  companyId: string | null
}) => {
  if (role && carrierRoles.includes(role)) {
    return true
  }

  // Em alguns bancos o profile é criado com role="user".
  // Para não bloquear transportadoras válidas, consideramos company_id como fallback.
  return Boolean(companyId)
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
  let companyId: string | null = null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileError && profile) {
    role = normalizeRole(profile.role)
    companyId = profile.company_id
  }

  if (!role || !companyId) {
    const { data: userRow, error: usersError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!usersError && userRow) {
      role = role ?? normalizeRole(userRow.role)
      companyId = companyId ?? userRow.company_id
    }
  }

  if (!role) {
    role = normalizeRole((user.user_metadata?.role as string | undefined) ?? (user.app_metadata?.role as string | undefined))
  }

  const accessByPage: Record<RoleGuardProps['allowedRole'], boolean> = {
    transportadora: hasTransportadoraAccess({ role, companyId }),
    cliente: role === 'client',
    admin: role === 'admin',
  }

  if (!accessByPage[allowedRole]) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
