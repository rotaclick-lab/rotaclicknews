import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  let dbOk = false

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('platform_settings').select('key').limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }

  const latency = Date.now() - start

  return NextResponse.json(
    {
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      db: dbOk ? 'ok' : 'error',
      latencyMs: latency,
    },
    { status: dbOk ? 200 : 503 }
  )
}
