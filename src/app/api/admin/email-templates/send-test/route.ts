import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return admin
}

const SAMPLE_VARS: Record<string, string> = {
  name: 'João da Silva (Teste)',
  carrierName: 'Transportadora Exemplo Ltda',
  originZip: '01310-100',
  destZip: '30130-110',
  prazo: '3 dias úteis',
  price: 'R$ 350,00',
  peso: '25.0 kg',
  companyName: 'Transportadora Exemplo Ltda',
  reason: 'Documentação incompleta — RNTRC não encontrado na base da ANTT.',
}

function interpolate(str: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), str)
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY não configurado' }, { status: 500 })

  const { to, subject, html } = await request.json()
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Campos obrigatórios: to, subject, html' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'RotaClick <noreply@notificacao.rotaclick.com.br>',
    replyTo: 'suporte@rotaclick.com.br',
    to,
    subject: `[TESTE] ${interpolate(subject, SAMPLE_VARS)}`,
    html: interpolate(html, SAMPLE_VARS),
  })

  if (error) {
    console.error('[Email Test]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
