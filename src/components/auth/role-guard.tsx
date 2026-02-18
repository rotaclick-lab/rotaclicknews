import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRole: 'transportadora' | 'cliente' | 'admin'
}

export async function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca o perfil do usuário para verificar a role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== allowedRole) {
    if (profile?.role === 'cliente') {
      redirect('/cliente')
    }

    // fallback para transportadora/admin
    redirect('/dashboard')
  }

  return <>{children}</>
}
