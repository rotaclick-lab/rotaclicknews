import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rotas do dashboard
  if (
    (request.nextUrl.pathname.startsWith('/dashboard') ||
     request.nextUrl.pathname.startsWith('/fretes') ||
     request.nextUrl.pathname.startsWith('/clientes') ||
     request.nextUrl.pathname.startsWith('/motoristas') ||
     request.nextUrl.pathname.startsWith('/veiculos') ||
     request.nextUrl.pathname.startsWith('/financeiro') ||
     request.nextUrl.pathname.startsWith('/relatorios') ||
     request.nextUrl.pathname.startsWith('/marketplace') ||
     request.nextUrl.pathname.startsWith('/configuracoes') ||
     request.nextUrl.pathname.startsWith('/notificacoes') ||
     request.nextUrl.pathname.startsWith('/tabela-frete') ||
     request.nextUrl.pathname.startsWith('/cotacao') ||
     request.nextUrl.pathname.startsWith('/cotacoes-recebidas') ||
     request.nextUrl.pathname.startsWith('/historico') ||
     request.nextUrl.pathname.startsWith('/rotas-realizadas') ||
     request.nextUrl.pathname.startsWith('/perfil')) &&
    !user
  ) {
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

  // A página raiz (/) agora é a cotação pública - acessível para todos
  // Não redirecionar mais para /dashboard

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
