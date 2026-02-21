import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MAINTENANCE_BYPASS_PATHS = ['/admin', '/api', '/auth', '/_next', '/favicon']

async function isMaintenanceMode(): Promise<{ active: boolean; message: string }> {
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
    if (!res.ok) return { active: false, message: '' }
    const rows = await res.json()
    const active = rows?.[0]?.value === 'true'
    if (!active) return { active: false, message: '' }

    const msgRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_settings?key=eq.maintenance_message&select=value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 30 },
      }
    )
    const msgRows = msgRes.ok ? await msgRes.json() : []
    const message = msgRows?.[0]?.value ?? 'Sistema em manutenção. Voltamos em breve.'
    return { active: true, message }
  } catch {
    return { active: false, message: '' }
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
    const { active, message } = await isMaintenanceMode()
    if (active) {
      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manutenção — RotaClick</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}.card{background:#fff;border-radius:1rem;padding:3rem 2rem;max-width:480px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.5rem;font-weight:800;color:#1e293b;margin-bottom:.75rem}p{color:#64748b;line-height:1.6}</style></head><body><div class="card"><div class="icon">🔧</div><h1>Sistema em Manutenção</h1><p>${message}</p></div></body></html>`
      return new NextResponse(html, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '300' },
      })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

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
