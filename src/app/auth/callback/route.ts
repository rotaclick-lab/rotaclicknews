import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Verifica se é primeiro acesso OAuth (sem profile completo)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const provider = user.app_metadata?.provider
      const isOAuth = provider === 'google' || provider === 'facebook'

      if (isOAuth) {
        const admin = createAdminClient()
        const { data: profile } = await admin
          .from('profiles')
          .select('cpf, phone, role')
          .eq('id', user.id)
          .maybeSingle()

        // Se não tem profile ou não tem CPF/phone, vai completar cadastro
        const needsCompletion = !profile || !profile.cpf || !profile.phone
        if (needsCompletion) {
          return NextResponse.redirect(`${origin}/cadastro/completar`)
        }

        // Profile completo — redireciona por role
        if (profile?.role === 'admin') return NextResponse.redirect(`${origin}/admin`)
        return NextResponse.redirect(`${origin}/cliente`)
      }
    }
  }

  // Fluxo normal (senha, magic link, reset)
  const redirectTo = next?.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`
  return NextResponse.redirect(redirectTo)
}
