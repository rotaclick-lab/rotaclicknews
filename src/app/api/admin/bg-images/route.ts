import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'bg-images'
const DEVICES = ['desktop', 'tablet', 'mobile'] as const

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return createAdminClient()
}

/** GET — lista imagens agrupadas por device */
export async function GET() {
  const admin = createAdminClient()
  const { data: files, error } = await admin.storage.from(BUCKET).list('', { limit: 200 })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const grouped: Record<string, { name: string; url: string; path: string }[]> = {
    desktop: [],
    tablet: [],
    mobile: [],
  }

  for (const f of files ?? []) {
    const device = DEVICES.find((d) => f.name.startsWith(`${d}/`)) ??
      DEVICES.find((d) => f.name.startsWith(d))
    const resolvedDevice = device ?? (f.name.includes('mobile') ? 'mobile' : f.name.includes('tablet') ? 'tablet' : 'desktop')
    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(f.name)
    grouped[resolvedDevice]?.push({ name: f.name, url: publicUrl, path: f.name })
  }

  // Listar subpastas desktop/, tablet/, mobile/
  for (const device of DEVICES) {
    const { data: subFiles } = await admin.storage.from(BUCKET).list(device, { limit: 100 })
    for (const f of subFiles ?? []) {
      if (!f.name || f.name === '.emptyFolderPlaceholder') continue
      const path = `${device}/${f.name}`
      const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
      if (!grouped[device]?.find((x) => x.path === path)) {
        grouped[device]?.push({ name: f.name, url: publicUrl, path })
      }
    }
  }

  return NextResponse.json({ success: true, data: grouped })
}

/** POST — upload de imagem */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const device = formData.get('device') as string | null

  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
  if (!DEVICES.includes(device as typeof DEVICES[number])) {
    return NextResponse.json({ error: 'Device inválido. Use: desktop, tablet ou mobile' }, { status: 400 })
  }

  const allowed = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato não permitido. Use WebP, JPG ou PNG.' }, { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'webp'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `${device}/${fileName}`

  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ success: true, url: publicUrl, path, device })
}

/** DELETE — remove imagem pelo path */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { path } = await req.json() as { path?: string }
  if (!path) return NextResponse.json({ error: 'Path obrigatório' }, { status: 400 })

  const { error } = await admin.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
