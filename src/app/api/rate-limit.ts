import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000 // 1 minuto
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(request: NextRequest, maxRequests = 20): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }

  entry.count++

  if (entry.count > maxRequests) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Tente novamente em 1 minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}
