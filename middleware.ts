import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MAINTENANCE_BYPASS_PATHS = ['/admin', '/admin-login', '/api', '/auth', '/_next', '/favicon', '/manutencao']

async function isMaintenanceMode(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 30 },
      }
    )
    if (!res.ok) return false
    const rows = await res.json()
    return rows?.[0]?.value === 'true'
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Redirecionar ?code= para callback
  const code = searchParams.get('code')
  if (pathname === '/' && code) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    url.searchParams.set('code', code)
    url.searchParams.set('next', '/auth/reset-password')
    return NextResponse.redirect(url)
  }

  // Verificar modo manutenção (exceto admin, api e auth)
  const isBypass = MAINTENANCE_BYPASS_PATHS.some(p => pathname.startsWith(p))
  if (!isBypass) {
    const active = await isMaintenanceMode()
    if (active) {
      const url = request.nextUrl.clone()
      url.pathname = '/manutencao'
      return NextResponse.rewrite(url, {
        headers: { 'Retry-After': '300' },
        status: 503,
      })
    }
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        'x-pathname': pathname,
      }),
    },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
