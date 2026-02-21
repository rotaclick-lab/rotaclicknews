import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await admin
      .from('campaigns')
      .select('id, title, description, type, image_url, link_url, link_label, bg_color, text_color, position')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, data: [] })
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch {
    return NextResponse.json({ success: false, data: [] })
  }
}
