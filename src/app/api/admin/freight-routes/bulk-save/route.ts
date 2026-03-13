import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { carrier_id, rows } = await request.json() as {
      carrier_id: string
      rows: Array<{
        carrier_id: string
        origin_zip: string
        origin_zip_end: string | null
        dest_zip: string
        dest_zip_end: string | null
        cost_price_per_kg: number | null
        price_per_kg: number | null
        margin_percent: number
        cost_min_price: number | null
        min_price: number
        deadline_days: number
        is_active: boolean
        source_file: string | null
        rate_card: object
      }>
    }

    if (!carrier_id || !rows?.length) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { error } = await admin.from('freight_routes').insert(
      rows.map(r => ({
        carrier_id: r.carrier_id,
        origin_zip: r.origin_zip,
        origin_zip_end: r.origin_zip_end,
        dest_zip: r.dest_zip,
        dest_zip_end: r.dest_zip_end,
        cost_price_per_kg: r.cost_price_per_kg,
        price_per_kg: r.price_per_kg,
        margin_percent: r.margin_percent,
        cost_min_price: r.cost_min_price,
        min_price: r.min_price,
        deadline_days: r.deadline_days,
        is_active: r.is_active,
        source_file: r.source_file,
        rate_card: r.rate_card,
        imported_at: new Date().toISOString(),
      }))
    )

    if (error) {
      console.error('[bulk-save]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: rows.length })
  } catch (error: unknown) {
    console.error('[bulk-save]', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
