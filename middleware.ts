import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: NÃO usar getSession() aqui pois não garante revalidação do token
  // getUser() faz uma chamada ao servidor Supabase Auth e renova o token automaticamente
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas do dashboard
  const protectedPaths = [
    '/dashboard',
    '/financeiro',
    '/relatorios',
    '/configuracoes',
    '/notificacoes',
    '/tabela-frete',
    '/cotacao',
    '/cotacoes-recebidas',
    '/historico',
    '/rotas-realizadas',
    '/perfil',
  ]

  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirecionar usuários logados da página de login/registro
  if (
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/registro') &&
    user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // A página raiz (/) é a cotação pública - acessível para todos

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
