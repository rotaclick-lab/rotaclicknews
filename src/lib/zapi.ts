const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID
const TOKEN = process.env.ZAPI_TOKEN
const BASE_URL = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`

async function sendText(phone: string, message: string): Promise<boolean> {
  if (!INSTANCE_ID || !TOKEN) {
    console.warn('[Z-API] Credenciais não configuradas — mensagem não enviada')
    return false
  }

  const cleanPhone = phone.replace(/\D/g, '')

  try {
    const res = await fetch(`${BASE_URL}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[Z-API] Erro ao enviar para ${cleanPhone}: ${res.status} — ${body}`)
      return false
    }

    return true
  } catch (e) {
    console.error('[Z-API] Falha na requisição:', e)
    return false
  }
}

// ─── Mensagens para o embarcador ─────────────────────────────────────────────

export async function notifyEmbarcadorFretePago(params: {
  phone: string
  carrierName: string
  originZip: string
  destZip: string
  deadlineDays?: number | null
  price: number
}) {
  const { phone, carrierName, originZip, destZip, deadlineDays, price } = params
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'a combinar'
  const msg =
    `✅ *Frete confirmado na RotaClick!*\n\n` +
    `🚛 Transportadora: *${carrierName}*\n` +
    `📍 Rota: ${originZip} → ${destZip}\n` +
    `⏱ Prazo estimado: ${prazo}\n` +
    `💰 Valor pago: *${fmtPrice}*\n\n` +
    `Acesse seu painel para acompanhar o status da entrega:\n` +
    `https://rotaclick.com.br/cliente`
  return sendText(phone, msg)
}

export async function notifyEmbarcadorEmTransito(params: {
  phone: string
  carrierName: string
  originZip: string
  destZip: string
  deadlineDays?: number | null
}) {
  const { phone, carrierName, originZip, destZip, deadlineDays } = params
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'a combinar'
  const msg =
    `🚛 *Sua carga está a caminho!*\n\n` +
    `Transportadora: *${carrierName}*\n` +
    `📍 ${originZip} → ${destZip}\n` +
    `⏱ Prazo estimado: ${prazo}\n\n` +
    `Acompanhe pelo painel: https://rotaclick.com.br/cliente`
  return sendText(phone, msg)
}

export async function notifyEmbarcadorEntregue(params: {
  phone: string
  carrierName: string
  originZip: string
  destZip: string
}) {
  const { phone, carrierName, originZip, destZip } = params
  const msg =
    `📦 *Entrega confirmada!*\n\n` +
    `Sua carga foi entregue com sucesso.\n` +
    `Transportadora: *${carrierName}*\n` +
    `📍 Rota: ${originZip} → ${destZip}\n\n` +
    `O comprovante está disponível no seu painel:\n` +
    `https://rotaclick.com.br/cliente/historico`
  return sendText(phone, msg)
}

export async function notifyEmbarcadorCancelado(params: {
  phone: string
  carrierName: string
}) {
  const { phone, carrierName } = params
  const msg =
    `❌ *Frete cancelado*\n\n` +
    `O frete com *${carrierName}* foi cancelado.\n` +
    `Se precisar de ajuda, entre em contato com nosso suporte:\n` +
    `https://rotaclick.com.br/cliente/suporte`
  return sendText(phone, msg)
}

// ─── Mensagens para a transportadora ─────────────────────────────────────────

export async function notifyTransportadoraNovoFrete(params: {
  phone: string
  originZip: string
  destZip: string
  price: number
  deadlineDays?: number | null
  taxableWeight?: number | null
}) {
  const { phone, originZip, destZip, price, deadlineDays, taxableWeight } = params
  const fmtPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const prazo = deadlineDays ? `${deadlineDays} dia(s) útei(s)` : 'a combinar'
  const peso = taxableWeight ? `${Number(taxableWeight).toFixed(1)} kg` : '—'
  const msg =
    `🆕 *Nova carga contratada na RotaClick!*\n\n` +
    `📍 Rota: *${originZip} → ${destZip}*\n` +
    `⚖️ Peso taxável: ${peso}\n` +
    `⏱ Prazo: ${prazo}\n` +
    `💰 Valor: *${fmtPrice}*\n\n` +
    `Acesse o painel para ver os detalhes e enviar o comprovante:\n` +
    `https://rotaclick.com.br/dashboard`
  return sendText(phone, msg)
}

export async function notifyTransportadoraComprovanteRequerido(params: {
  phone: string
  originZip: string
  destZip: string
}) {
  const { phone, originZip, destZip } = params
  const msg =
    `📎 *Comprovante solicitado*\n\n` +
    `O comprovante de entrega do frete *${originZip} → ${destZip}* foi solicitado.\n\n` +
    `Faça o upload pelo painel:\n` +
    `https://rotaclick.com.br/dashboard`
  return sendText(phone, msg)
}

export async function notifyTransportadoraEnviarTabela(params: {
  phone: string
  name: string
  companyName: string
  cnpj: string
}) {
  const { phone, name, companyName, cnpj } = params
  const cnpjClean = cnpj.replace(/\D/g, '')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rotaclick.com.br'
  const templateUrl = `${appUrl}/api/admin/freight-routes/template?cnpj=${cnpjClean}`
  const msg =
    `🎉 Olá *${name}*! Cadastro da *${companyName}* recebido na RotaClick!\n\n` +
    `Para avançarmos com sua aprovação, precisamos da sua *tabela de frete* no nosso modelo padrão.\n\n` +
    `📋 *Como enviar:*\n` +
    `1️⃣ Baixe o modelo com seus dados já preenchidos:\n` +
    `${templateUrl}\n\n` +
    `2️⃣ Preencha as rotas, preços e prazos\n\n` +
    `3️⃣ Envie o arquivo preenchido para:\n` +
    `📧 frete@rotaclick.com.br\n` +
    `📱 WhatsApp: (11) 3514-2933\n\n` +
    `⚠️ Não altere o CNPJ no arquivo — ele identifica sua empresa automaticamente.\n\n` +
    `Dúvidas? Estamos aqui! 😊`
  return sendText(phone, msg)
}
