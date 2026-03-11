import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET — retorna todas as platform_settings como mapa chave:valor (rota pública para leitura) */
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_settings')
      .select('key, value')
      .order('key')
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const map: Record<string, string> = {}
    for (const row of data ?? []) {
      map[row.key] = row.value ?? ''
    }
    return NextResponse.json({ success: true, data: map })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
