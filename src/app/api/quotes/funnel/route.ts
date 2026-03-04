import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      originCep,
      destinationCep,
      taxableWeight,
      invoiceValue,
      resultsCount,
      contactName,
      contactEmail,
      contactPhone,
      originCity,
      destinationCity,
    } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    await admin.from('quote_funnel').insert({
      user_id: user?.id ?? null,
      contact_name: contactName ?? null,
      contact_email: contactEmail ?? null,
      contact_phone: contactPhone ?? null,
      origin_zip: originCep?.replace(/\D/g, '') ?? null,
      dest_zip: destinationCep?.replace(/\D/g, '') ?? null,
      origin_city: originCity ?? null,
      dest_city: destinationCity ?? null,
      taxable_weight: taxableWeight ?? null,
      invoice_value: invoiceValue ?? null,
      results_count: resultsCount ?? 0,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Nunca deixar o funil bloquear o usuário
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
