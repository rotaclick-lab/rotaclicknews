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
    if (allowedRole === 'admin') {
      redirect(`/admin-login?next=${encodeURIComponent(pathname)}`)
    }
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== allowedRole) {
    if (profile?.role === 'admin') redirect('/admin')
    if (profile?.role === 'cliente') redirect('/cliente')
    redirect('/dashboard')
  }

  // Para transportadoras, verificar approval_status da empresa
  if (allowedRole === 'transportadora' && profile.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('approval_status')
      .eq('id', profile.company_id)
      .single()

    if (company?.approval_status === 'pending') {
      redirect('/aguardando-aprovacao')
    }
    if (company?.approval_status === 'rejected') {
      redirect('/cadastro-rejeitado')
    }
  }

  return <>{children}</>
}
