import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM = 'RotaClick <noreply@notificacao.rotaclick.com.br>'
const REPLY_TO = 'suporte@rotaclick.com.br'

// Cores e marca
const BRAND = {
  primary: '#13b9a5',
  primaryDark: '#0e9a89',
  secondary: '#F5921B',
  dark: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f1f5f9',
  white: '#ffffff',
}

async function getBrandSettings(): Promise<{ logoUrl: string; name: string; primaryColor: string }> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('platform_settings')
      .select('key, value')
      .in('key', ['brand_logo_url', 'brand_name', 'brand_primary_color'])
    const map: Record<string, string> = {}
    for (const row of data ?? []) map[row.key] = row.value ?? ''
    return {
      logoUrl: map['brand_logo_url'] ?? '',
      name: map['brand_name'] ?? 'RotaClick',
      primaryColor: map['brand_primary_color'] ?? BRAND.primary,
    }
  } catch {
    return { logoUrl: '', name: 'RotaClick', primaryColor: BRAND.primary }
  }
}

async function getTemplate(id: string): Promise<{ subject: string; html: string } | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('email_templates')
      .select('subject, html')
      .eq('id', id)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

function interpolate(str: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), str)
}

function buildLogoHtml(brand: { logoUrl: string; name: string }): string {
  return brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="height:40px;max-width:180px;object-fit:contain;display:block;"/>`
    : `<span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-1px;font-family:'Segoe UI',Arial,sans-serif;">${brand.name}</span>`
}

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

function base(content: string, brand: { logoUrl: string; name: string; primaryColor: string }, accentColor?: string): string {
  const color = accentColor ?? brand.primaryColor
  const logoHtml = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="height:40px;max-width:180px;object-fit:contain;display:block;"/>`
    : `<span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-1px;font-family:'Segoe UI',Arial,sans-serif;">${brand.name}</span>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>${brand.name}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BRAND.bg};min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">

  <!-- Card -->
  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,${color} 0%,${color}cc 100%);padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:28px 36px 24px;">
              ${logoHtml}
            </td>
            <td style="padding:28px 36px 24px;text-align:right;">
              <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span>
            </td>
          </tr>
          <!-- Decorative bar -->
          <tr>
            <td colspan="2" style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
                <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
                <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px 36px;color:${BRAND.text};font-size:15px;line-height:1.6;">
        ${content}
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:0 36px;">
        <div style="height:1px;background:${BRAND.border};"></div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:24px 36px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:13px;color:${BRAND.muted};">
                <strong style="color:${BRAND.text};">${brand.name}</strong> — Cotação inteligente de frete
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                <a href="https://rotaclick.com.br" style="color:${color};text-decoration:none;">rotaclick.com.br</a>
                &nbsp;·&nbsp;
                <a href="mailto:suporte@rotaclick.com.br" style="color:${color};text-decoration:none;">suporte@rotaclick.com.br</a>
                &nbsp;·&nbsp;
                <a href="https://wa.me/551135142933" style="color:${color};text-decoration:none;">(11) 3514-2933</a>
              </p>
            </td>
            <td style="text-align:right;vertical-align:bottom;">
              <span style="font-size:22px;">🚛</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma ${brand.name}.<br/>Este é um e-mail automático, por favor não responda diretamente.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- /Card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`
}

function btn(href: string, label: string, color: string = BRAND.primary): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
  <tr>
    <td style="border-radius:8px;background:${color};">
      <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">${label}</a>
    </td>
  </tr>
</table>`
}

function infoBox(rows: string[], bgColor = '#f8fafc', borderColor = BRAND.border): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;margin:20px 0;">
  <tr><td style="padding:18px 22px;">
    ${rows.map(r => `<p style="margin:0 0 8px;font-size:14px;color:${BRAND.text};">${r}</p>`).join('').replace(/style="margin:0 0 8px[^"]+">([^<]+<\/p>)$/, `style="margin:0;font-size:14px;color:${BRAND.text};">$1`)}
  </td></tr>
</table>`
}

function alertBox(message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info'): string {
  const styles = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ️' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '✅' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
    danger:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '❌' },
  }
  const s = styles[type]
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${s.bg};border:1px solid ${s.border};border-radius:10px;margin:20px 0;">
  <tr><td style="padding:14px 18px;">
    <p style="margin:0;font-size:14px;color:${s.color};">${s.icon}&nbsp;&nbsp;${message}</p>
  </td></tr>
</table>`
}

// ─── Embarcador: frete confirmado ────────────────────────────────────────────

export async function emailEmbarcadorFretePago(params: {
  to: string; name: string; carrierName: string
  originZip: string; destZip: string; price: number; deadlineDays?: number | null
}) {
  const { to, name, carrierName, originZip, destZip, price, deadlineDays } = params
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'A combinar'
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const tpl = await getTemplate('frete-pago')
  const brand = await getBrandSettings()
  const vars = { name, carrierName, originZip, destZip, prazo, price: fmtPrice, logoHtml: buildLogoHtml(brand) }
  const subject = interpolate(tpl?.subject ?? `✅ Frete confirmado — {{carrierName}}`, vars)
  const html = tpl ? interpolate(tpl.html, vars) : base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Frete confirmado! ✅</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Olá, <strong>${name}</strong>! Seu frete foi contratado com sucesso.</p>
    ${infoBox([
      `🚛 <strong>Transportadora:</strong> ${carrierName}`,
      `📍 <strong>Rota:</strong> ${originZip} → ${destZip}`,
      `⏱ <strong>Prazo estimado:</strong> ${prazo}`,
      `💰 <strong>Valor pago:</strong> <span style="color:${brand.primaryColor};font-size:16px;font-weight:700;">${fmtPrice}</span>`,
    ], '#f0fdf4', '#bbf7d0')}
    <p style="margin:0;color:${BRAND.muted};font-size:14px;">Acompanhe o status da entrega pelo seu painel.</p>
    ${btn('https://rotaclick.com.br/cliente', 'Acessar Meu Painel', brand.primaryColor)}
  `, brand)
  return send({ to, subject, html })
}

// ─── Embarcador: boas-vindas ─────────────────────────────────────────────────

export async function emailBoasVindasEmbarcador(params: { to: string; name: string }) {
  const { to, name } = params
  const tpl = await getTemplate('boas-vindas')
  const brand = await getBrandSettings()
  const vars = { name, logoHtml: buildLogoHtml(brand) }
  const subject = interpolate(tpl?.subject ?? `👋 Bem-vindo à ${brand.name}!`, vars)
  const html = tpl ? interpolate(tpl.html, vars) : base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Bem-vindo à ${brand.name}! 👋</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Olá, <strong>${name}</strong>! Sua conta foi criada com sucesso. Veja o que você pode fazer:</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid ${brand.primaryColor};margin-bottom:10px;display:block;">
          <p style="margin:0;font-size:14px;color:${BRAND.text};">⚡ <strong>Cotar frete</strong> com múltiplas transportadoras em segundos</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid ${brand.primaryColor};">
          <p style="margin:0;font-size:14px;color:${BRAND.text};">🔒 <strong>Contratar e pagar</strong> com segurança via cartão</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid ${brand.primaryColor};">
          <p style="margin:0;font-size:14px;color:${BRAND.text};">📦 <strong>Acompanhar</strong> todas as suas entregas em um só lugar</p>
        </td>
      </tr>
    </table>
    ${btn('https://rotaclick.com.br/cliente', 'Fazer minha primeira cotação', brand.primaryColor)}
  `, brand)
  return send({ to, subject, html })
}

// ─── Transportadora: cadastro aprovado ───────────────────────────────────────

export async function emailTransportadoraAprovada(params: { to: string; name: string; companyName: string }) {
  const { to, name, companyName } = params
  const tpl = await getTemplate('transp-aprovada')
  const brand = await getBrandSettings()
  const vars = { name, companyName, logoHtml: buildLogoHtml(brand) }
  const subject = interpolate(tpl?.subject ?? `🎉 Cadastro aprovado na ${brand.name}!`, vars)
  const html = tpl ? interpolate(tpl.html, vars) : base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Cadastro aprovado! 🎉</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Parabéns, <strong>${name}</strong>! O cadastro da <strong>${companyName}</strong> foi aprovado na plataforma.</p>
    ${alertBox('Sua empresa já está ativa e visível para embarcadores em toda a plataforma.', 'success')}
    ${infoBox([
      '✅ Acesse o painel e verifique sua tabela de frete',
      '📋 Configure seus dados e documentos',
      '🚛 Em breve você começará a receber cotações!',
    ], '#f0fdf4', '#bbf7d0')}
    ${btn('https://rotaclick.com.br/dashboard', 'Acessar Painel da Transportadora', brand.primaryColor)}
  `, brand)
  return send({ to, subject, html })
}

// ─── Transportadora: cadastro rejeitado ──────────────────────────────────────

export async function emailTransportadoraRejeitada(params: { to: string; name: string; companyName: string; reason: string }) {
  const { to, name, companyName, reason } = params
  const tpl = await getTemplate('transp-rejeitada')
  const brand = await getBrandSettings()
  const vars = { name, companyName, reason, logoHtml: buildLogoHtml(brand) }
  const subject = interpolate(tpl?.subject ?? `Atualização sobre seu cadastro na ${brand.name}`, vars)
  const html = tpl ? interpolate(tpl.html, vars) : base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Atualização sobre seu cadastro</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Olá, <strong>${name}</strong>. Analisamos o cadastro da <strong>${companyName}</strong> e precisamos informar:</p>
    ${alertBox('Seu cadastro não foi aprovado neste momento. Veja o motivo abaixo.', 'danger')}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:16px 0 24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Motivo da reprovação</p>
        <p style="margin:0;font-size:14px;color:${BRAND.text};">${reason}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:${BRAND.muted};font-size:14px;">Precisa de ajuda ou deseja contestar? Entre em contato:</p>
    <p style="margin:0;font-size:14px;">
      <a href="mailto:suporte@rotaclick.com.br" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">suporte@rotaclick.com.br</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/551135142933" style="color:${brand.primaryColor};text-decoration:none;font-weight:600;">(11) 3514-2933</a>
    </p>
  `, brand)
  return send({ to, subject, html })
}

// ─── Transportadora: novo frete contratado ───────────────────────────────────

export async function emailTransportadoraNovoFrete(params: {
  to: string; name: string; originZip: string; destZip: string
  price: number; deadlineDays?: number | null; taxableWeight?: number | null
}) {
  const { to, name, originZip, destZip, price, deadlineDays, taxableWeight } = params
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'A combinar'
  const peso = taxableWeight ? `${Number(taxableWeight).toFixed(1)} kg` : '—'
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const tpl = await getTemplate('transp-novo-frete')
  const brand = await getBrandSettings()
  const vars = { name, originZip, destZip, prazo, peso, price: fmtPrice, logoHtml: buildLogoHtml(brand) }
  const subject = interpolate(tpl?.subject ?? `🆕 Nova carga contratada — {{originZip}} → {{destZip}}`, vars)
  const html = tpl ? interpolate(tpl.html, vars) : base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Nova carga contratada! 🆕</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Olá, <strong>${name}</strong>! Uma nova carga foi contratada com sua empresa.</p>
    ${infoBox([
      `📍 <strong>Rota:</strong> CEP ${originZip} → CEP ${destZip}`,
      `⚖️ <strong>Peso taxável:</strong> ${peso}`,
      `⏱ <strong>Prazo acordado:</strong> ${prazo}`,
      `💰 <strong>Valor:</strong> <span style="color:${brand.primaryColor};font-size:16px;font-weight:700;">${fmtPrice}</span>`,
    ], '#fffbeb', '#fde68a')}
    ${alertBox('Acesse o painel para ver os detalhes completos e iniciar o atendimento.', 'info')}
    ${btn('https://rotaclick.com.br/dashboard', 'Ver Carga no Painel', brand.primaryColor)}
  `, brand)
  return send({ to, subject, html })
}

// ─── Interno: nova cotação solicitada ────────────────────────────────────────

export async function emailInternaNovaCotacao(params: {
  clientName: string; clientEmail: string; clientPhone: string
  originZip: string; destZip: string; weight: number; invoiceValue: number
}) {
  const { clientName, clientEmail, clientPhone, originZip, destZip, weight, invoiceValue } = params
  const fmtValue = invoiceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const to = 'operacoes@rotaclick.com.br'
  const brand = await getBrandSettings()
  const html = base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Nova cotação solicitada 📋</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Um embarcador acabou de solicitar cotação na plataforma.</p>
    ${infoBox([
      `👤 <strong>Nome:</strong> ${clientName}`,
      `📧 <strong>E-mail:</strong> ${clientEmail}`,
      `📱 <strong>Telefone:</strong> ${clientPhone}`,
      `📍 <strong>Rota:</strong> CEP ${originZip} → CEP ${destZip}`,
      `⚖️ <strong>Peso:</strong> ${weight} kg`,
      `💰 <strong>Valor NF:</strong> ${fmtValue}`,
    ])}
    ${btn('https://rotaclick.com.br/admin', 'Acessar Painel Admin', brand.primaryColor)}
  `, brand, BRAND.secondary)
  return send({ to, subject: `📋 Nova cotação — ${clientName}`, html })
}

// ─── Transportadora: enviar template de tabela de frete ───────────────────────

export async function emailTransportadoraTemplateTabela(params: {
  to: string
  name: string
  companyName: string
  cnpj: string
}) {
  const { to, name, companyName, cnpj } = params
  const cnpjClean = cnpj.replace(/\D/g, '')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rotaclick.com.br'
  const templateUrl = `${appUrl}/api/admin/freight-routes/template?cnpj=${cnpjClean}`
  const brand = await getBrandSettings()

  const html = base(`
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND.dark};">Cadastro recebido! Próximo passo 📋</h1>
    <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;">Olá, <strong>${name}</strong>! O cadastro da <strong>${companyName}</strong> foi recebido e está em análise.</p>

    <p style="margin:0 0 16px;color:${BRAND.text};font-size:15px;">Para avançar com a aprovação, precisamos da sua <strong>tabela de frete</strong> no modelo padrão da plataforma.</p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:12px;border:1px solid ${BRAND.border};margin:0 0 20px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-size:14px;color:${BRAND.dark};font-weight:700;">Como enviar em 3 passos:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${brand.primaryColor};color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</span>
            </td>
            <td style="padding-left:10px;padding-bottom:12px;font-size:14px;color:${BRAND.text};">Baixe o modelo abaixo — <strong>seus dados já estão preenchidos</strong></td>
          </tr>
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${brand.primaryColor};color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</span>
            </td>
            <td style="padding-left:10px;padding-bottom:12px;font-size:14px;color:${BRAND.text};">Preencha as rotas, preços e prazos nas colunas indicadas</td>
          </tr>
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:1px;">
              <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${brand.primaryColor};color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</span>
            </td>
            <td style="padding-left:10px;font-size:14px;color:${BRAND.text};">
              Envie o arquivo para:<br/>
              📧 <a href="mailto:frete@rotaclick.com.br" style="color:${brand.primaryColor};font-weight:600;">frete@rotaclick.com.br</a><br/>
              📱 <a href="https://wa.me/551135142933" style="color:${brand.primaryColor};font-weight:600;">WhatsApp (11) 3514-2933</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${alertBox(`🔒 O modelo já contém seu CNPJ <strong>${cnpjClean}</strong> e nome da empresa. Não altere essas informações — elas identificam sua empresa automaticamente no sistema.`, 'warning')}

    ${btn(templateUrl, '⬇️ Baixar Meu Modelo de Tabela', brand.primaryColor)}

    <p style="margin:20px 0 0;font-size:13px;color:${BRAND.muted};">Dúvidas sobre o preenchimento? Fale conosco em <a href="mailto:frete@rotaclick.com.br" style="color:${brand.primaryColor};">frete@rotaclick.com.br</a></p>
  `, brand)

  return send({ to, subject: `📋 ${companyName} — Envie sua tabela de frete para a ${brand.name}`, html })
}
