import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'bg-images'
const FOLDER = 'carrier-placeholder'
const SETTING_KEY = 'carrier_placeholder_image_url'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return createAdminClient()
}

/** POST — faz upload da imagem placeholder de transportadora */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG, WebP, SVG ou GIF.' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
  }

  // Remove imagem anterior
  const { data: existing } = await admin.storage.from(BUCKET).list(FOLDER, { limit: 50 })
  if (existing?.length) {
    const toRemove = existing
      .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
      .map((f) => `${FOLDER}/${f.name}`)
    if (toRemove.length) await admin.storage.from(BUCKET).remove(toRemove)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `carrier-placeholder-${Date.now()}.${ext}`
  const path = `${FOLDER}/${fileName}`

  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await admin.from('platform_settings').upsert(
    { key: SETTING_KEY, value: publicUrl, updated_by: user?.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true, url: publicUrl, path })
}

/** DELETE — remove imagem placeholder */
export async function DELETE() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { data: existing } = await admin.storage.from(BUCKET).list(FOLDER, { limit: 50 })
  const toRemove = (existing ?? [])
    .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
    .map((f) => `${FOLDER}/${f.name}`)

  if (toRemove.length) {
    const { error } = await admin.storage.from(BUCKET).remove(toRemove)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('platform_settings').upsert(
    { key: SETTING_KEY, value: '', updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true })
}
