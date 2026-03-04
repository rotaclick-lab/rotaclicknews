import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'delivery-proofs'
const MAX_FILES = 5
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: freightId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Verificar que o frete pertence a esta transportadora
  const { data: freight, error: freightError } = await admin
    .from('freights')
    .select('id, carrier_id, carrier_name, proof_urls, payment_status')
    .eq('id', freightId)
    .maybeSingle()

  if (freightError || !freight) {
    return NextResponse.json({ error: 'Frete não encontrado' }, { status: 404 })
  }

  if (freight.carrier_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão para este frete' }, { status: 403 })
  }

  const existingUrls: string[] = Array.isArray(freight.proof_urls) ? freight.proof_urls : []
  if (existingUrls.length >= MAX_FILES) {
    return NextResponse.json({ error: `Limite de ${MAX_FILES} comprovantes por frete atingido` }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG, WebP ou PDF.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 })
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]
  const path = `${freightId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('Upload comprovante error:', uploadError)
    return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
  }

  const newUrls = [...existingUrls, path]
  const { error: updateError } = await admin
    .from('freights')
    .update({
      proof_urls: newUrls,
      proof_uploaded_at: new Date().toISOString(),
      proof_uploaded_by: user.id,
      status: 'delivered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', freightId)

  if (updateError) {
    return NextResponse.json({ error: 'Arquivo salvo mas falha ao atualizar frete' }, { status: 500 })
  }

  await admin.from('audit_logs').insert({
    user_id: user.id,
    action: 'UPLOAD',
    resource_type: 'freights',
    resource_id: freightId,
    description: `Comprovante de entrega enviado: ${path}`,
  })

  return NextResponse.json({ success: true, path, totalProofs: newUrls.length })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: freightId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: freight, error: freightError } = await admin
    .from('freights')
    .select('id, carrier_id, user_id, proof_urls, proof_uploaded_at')
    .eq('id', freightId)
    .maybeSingle()

  if (freightError || !freight) {
    return NextResponse.json({ error: 'Frete não encontrado' }, { status: 404 })
  }

  // Apenas a transportadora ou o embarcador dono do frete podem ver
  if (freight.carrier_id !== user.id && freight.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const paths: string[] = Array.isArray(freight.proof_urls) ? freight.proof_urls : []

  const signedUrls = await Promise.all(
    paths.map(async (path) => {
      const { data } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600) // válido 1h
      return { path, url: data?.signedUrl ?? null }
    })
  )

  return NextResponse.json({
    success: true,
    proofs: signedUrls,
    uploadedAt: freight.proof_uploaded_at,
  })
}
