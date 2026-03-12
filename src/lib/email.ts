import { Resend } from 'resend'

const FROM = 'RotaClick <noreply@notificacao.rotaclick.com.br>'
const REPLY_TO = 'suporte@rotaclick.com.br'

async function send(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY não configurado — email não enviado')
    return false
  }
  const resend = new Resend(apiKey)
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) {
      console.error('[Email] Erro ao enviar:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[Email] Falha na requisição:', e)
    return false
  }
}

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
          <span style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">🚛 RotaClick</span>
        </td>
      </tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            RotaClick — Cotação inteligente de frete | 
            <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>
            Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">${label}</a>`
}

// ─── Embarcador: frete confirmado ────────────────────────────────────────────

export async function emailEmbarcadorFretePago(params: {
  to: string
  name: string
  carrierName: string
  originZip: string
  destZip: string
  price: number
  deadlineDays?: number | null
}) {
  const { to, name, carrierName, originZip, destZip, price, deadlineDays } = params
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'A combinar'

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">✅ Frete confirmado!</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>${name}</strong>! Seu frete foi contratado com sucesso.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>🚛 Transportadora:</strong> ${carrierName}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> ${originZip} → ${destZip}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo estimado:</strong> ${prazo}</p>
        <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor pago:</strong> ${fmtPrice}</p>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0;">Acompanhe o status da entrega pelo seu painel.</p>
    ${btn('https://rotaclick.com.br/cliente', 'Acessar Meu Painel')}
  `)

  return send({ to, subject: `✅ Frete confirmado — ${carrierName}`, html })
}

// ─── Embarcador: boas-vindas ─────────────────────────────────────────────────

export async function emailBoasVindasEmbarcador(params: {
  to: string
  name: string
}) {
  const { to, name } = params

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">👋 Bem-vindo à RotaClick!</h2>
    <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>! Sua conta foi criada com sucesso.</p>
    <p style="color:#374151;margin:0 0 12px;font-size:15px;">Com a RotaClick você pode:</p>
    <ul style="color:#374151;font-size:14px;padding-left:20px;margin:0 0 24px;">
      <li style="margin-bottom:8px;">Cotar frete com múltiplas transportadoras em segundos</li>
      <li style="margin-bottom:8px;">Contratar e pagar com segurança via cartão</li>
      <li style="margin-bottom:8px;">Acompanhar todas as suas entregas em um só lugar</li>
    </ul>
    ${btn('https://rotaclick.com.br/cliente', 'Fazer minha primeira cotação')}
  `)

  return send({ to, subject: '👋 Bem-vindo à RotaClick!', html })
}

// ─── Transportadora: cadastro aprovado ───────────────────────────────────────

export async function emailTransportadoraAprovada(params: {
  to: string
  name: string
  companyName: string
}) {
  const { to, name, companyName } = params

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🎉 Cadastro aprovado!</h2>
    <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>! O cadastro da empresa <strong>${companyName}</strong> foi aprovado pela RotaClick.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅ Sua empresa já está ativa na plataforma</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;">📋 Acesse o painel e cadastre sua tabela de frete</p>
        <p style="margin:0;font-size:14px;color:#374151;">🚛 Em breve você começará a receber cotações!</p>
      </td></tr>
    </table>
    ${btn('https://rotaclick.com.br/dashboard', 'Acessar Painel da Transportadora')}
  `)

  return send({ to, subject: '🎉 Cadastro aprovado na RotaClick!', html })
}

// ─── Transportadora: cadastro rejeitado ──────────────────────────────────────

export async function emailTransportadoraRejeitada(params: {
  to: string
  name: string
  companyName: string
  reason: string
}) {
  const { to, name, companyName, reason } = params

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Atualização sobre seu cadastro</h2>
    <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>. Infelizmente o cadastro da empresa <strong>${companyName}</strong> não foi aprovado neste momento.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;font-weight:bold;text-transform:uppercase;">Motivo</p>
        <p style="margin:0;font-size:14px;color:#374151;">${reason}</p>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Em caso de dúvidas, entre em contato com nosso suporte:</p>
    <p style="margin:0;"><a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;font-size:14px;">suporte@rotaclick.com.br</a> &nbsp;|&nbsp; (11) 3514-2933</p>
  `)

  return send({ to, subject: 'Atualização sobre seu cadastro na RotaClick', html })
}

// ─── Transportadora: novo frete contratado ───────────────────────────────────

export async function emailTransportadoraNovoFrete(params: {
  to: string
  name: string
  originZip: string
  destZip: string
  price: number
  deadlineDays?: number | null
  taxableWeight?: number | null
}) {
  const { to, name, originZip, destZip, price, deadlineDays, taxableWeight } = params
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'A combinar'
  const peso = taxableWeight ? `${Number(taxableWeight).toFixed(1)} kg` : '—'

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🆕 Nova carga contratada!</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>${name}</strong>! Uma nova carga foi contratada na RotaClick para sua transportadora.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> ${originZip} → ${destZip}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⚖️ Peso taxável:</strong> ${peso}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo:</strong> ${prazo}</p>
        <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor:</strong> ${fmtPrice}</p>
      </td></tr>
    </table>
    <p style="color:#6b7280;font-size:14px;margin:0;">Acesse o painel para ver os detalhes e enviar o comprovante de entrega.</p>
    ${btn('https://rotaclick.com.br/dashboard', 'Ver no Painel')}
  `)

  return send({ to, subject: `🆕 Nova carga contratada — ${originZip} → ${destZip}`, html })
}

// ─── Interno: nova cotação solicitada ────────────────────────────────────────

export async function emailInternaNovaCotacao(params: {
  clientName: string
  clientEmail: string
  clientPhone: string
  originZip: string
  destZip: string
  weight: number
  invoiceValue: number
}) {
  const { clientName, clientEmail, clientPhone, originZip, destZip, weight, invoiceValue } = params
  const fmtValue = invoiceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const to = 'operacoes@rotaclick.com.br'

  const html = base(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">📋 Nova cotação solicitada</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Um embarcador solicitou cotação na plataforma.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>👤 Nome:</strong> ${clientName}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📧 E-mail:</strong> ${clientEmail}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📱 Telefone:</strong> ${clientPhone}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> ${originZip} → ${destZip}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⚖️ Peso:</strong> ${weight} kg</p>
        <p style="margin:0;font-size:14px;color:#374151;"><strong>💰 Valor NF:</strong> ${fmtValue}</p>
      </td></tr>
    </table>
    ${btn('https://rotaclick.com.br/admin', 'Ver no Admin')}
  `)

  return send({ to, subject: `📋 Nova cotação — ${clientName}`, html })
}
