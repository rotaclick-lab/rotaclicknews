import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'bg-images'
const FOLDER = 'brand-logo'
const SETTING_KEY = 'brand_logo_url'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { admin: createAdminClient(), user }
}

/** POST — faz upload do logotipo da plataforma */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { admin, user } = auth

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG, WebP, SVG ou GIF.' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
  }

  // Remove logo anterior
  const { data: existing } = await admin.storage.from(BUCKET).list(FOLDER, { limit: 50 })
  if (existing?.length) {
    const toRemove = existing
      .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
      .map((f) => `${FOLDER}/${f.name}`)
    if (toRemove.length) await admin.storage.from(BUCKET).remove(toRemove)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const fileName = `logo-${Date.now()}.${ext}`
  const path = `${FOLDER}/${fileName}`

  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  await admin.from('platform_settings').upsert(
    { key: SETTING_KEY, value: publicUrl, updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true, url: publicUrl })
}

/** DELETE — remove o logotipo */
export async function DELETE() {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { admin } = auth

  const { data: existing } = await admin.storage.from(BUCKET).list(FOLDER, { limit: 50 })
  const toRemove = (existing ?? [])
    .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
    .map((f) => `${FOLDER}/${f.name}`)
  if (toRemove.length) await admin.storage.from(BUCKET).remove(toRemove)

  await admin.from('platform_settings').upsert(
    { key: SETTING_KEY, value: '', updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true })
}
