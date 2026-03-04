import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const admin = createAdminClient()

  // Remove arquivo anterior se existir
  await admin.storage.from('avatars').remove([
    `${user.id}/avatar.jpg`,
    `${user.id}/avatar.jpeg`,
    `${user.id}/avatar.png`,
    `${user.id}/avatar.webp`,
  ])

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadError.message }, { status: 500 })
  }

  const { data: publicData } = admin.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = publicData.publicUrl + `?t=${Date.now()}`

  // Salvar URL no perfil
  await admin.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } })

  return NextResponse.json({ success: true, url: avatarUrl })
}
