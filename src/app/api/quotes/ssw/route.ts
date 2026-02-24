import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface SswConfig {
  dominio: string
  cnpj_pagador: string
  senha: string
}

interface SswQuoteParams {
  cepOrigem: string
  cepDestino: string
  peso: number
  valor: number
  volumes: number
  companyId: string
  companyName: string
  logoUrl?: string
}

interface SswQuoteResult {
  id: string
  carrier: string
  price: number
  deadline: string
  logoUrl: string | null
  origin: string
  destination: string
  source: 'ssw'
}

function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '').padStart(8, '0')
}

function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

async function callSswWebservice(config: SswConfig, params: SswQuoteParams): Promise<SswQuoteResult | null> {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://www.ssw.inf.br/WebServices/">
  <soapenv:Header/>
  <soapenv:Body>
    <web:cotar>
      <web:dominio>${config.dominio}</web:dominio>
      <web:login>${cleanCnpj(config.cnpj_pagador)}</web:login>
      <web:senha>${config.senha}</web:senha>
      <web:nrIdentifClienteRem>0</web:nrIdentifClienteRem>
      <web:nrIdentifClienteDest>0</web:nrIdentifClienteDest>
      <web:cepOrigem>${cleanCep(params.cepOrigem)}</web:cepOrigem>
      <web:cepDestino>${cleanCep(params.cepDestino)}</web:cepDestino>
      <web:vlMercadoria>${params.valor.toFixed(2)}</web:vlMercadoria>
      <web:peso>${params.peso.toFixed(3)}</web:peso>
      <web:volumes>${params.volumes}</web:volumes>
      <web:cdServico>0</web:cdServico>
    </web:cotar>
  </soapenv:Body>
</soapenv:Envelope>`

  const url = 'https://ssw.inf.br/ws/sswCotacaoCliente/index.php'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"cotar"',
    },
    body: soapBody,
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    console.error(`SSW HTTP error for ${params.companyName}: ${response.status}`)
    return null
  }

  const xml = await response.text()

  // Extrai valores do XML de retorno
  const getTag = (tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'))
    return match && match[1] !== undefined ? match[1].trim() : null
  }

  const erro = getTag('erro')

  if (erro !== '0' && erro !== '1') {
    const mensagem = getTag('mensagem')
    console.warn(`SSW erro ${erro} para ${params.companyName}: ${mensagem}`)
    return null
  }

  const totalFrete = parseFloat(getTag('totalFrete') ?? '0')
  const prazo = parseInt(getTag('prazo') ?? '0', 10)

  if (!totalFrete || totalFrete <= 0) return null

  return {
    id: `ssw_${params.companyId}`,
    carrier: params.companyName,
    price: totalFrete,
    deadline: prazo === 1 ? '1 dia útil' : `${prazo} dias úteis`,
    logoUrl: params.logoUrl ?? null,
    origin: params.cepOrigem,
    destination: params.cepDestino,
    source: 'ssw',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cepOrigem, cepDestino, peso, valor, volumes } = body

    if (!cepOrigem || !cepDestino || !peso || !valor) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Busca todas as integrações SSW ativas
    const { data: integrations, error } = await admin
      .from('carrier_integrations')
      .select('*, company:companies(id, name, cnpj, document, logo_url)')
      .eq('integration_type', 'ssw')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao buscar integrações SSW:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Chama o SSW em paralelo para todas as transportadoras com integração ativa
    const promises = integrations.map(async (integration) => {
      const config = integration.config as SswConfig
      if (!config?.dominio || !config?.cnpj_pagador || !config?.senha) {
        console.warn(`Integração SSW incompleta para company ${integration.company_id}`)
        return null
      }

      const company = integration.company as { id: string; name: string; cnpj: string; document: string; logo_url: string } | null
      if (!company) return null

      return callSswWebservice(config, {
        cepOrigem,
        cepDestino,
        peso: Number(peso),
        valor: Number(valor),
        volumes: Number(volumes) || 1,
        companyId: company.id,
        companyName: company.name,
        logoUrl: company.logo_url ?? undefined,
      })
    })

    const results = await Promise.allSettled(promises)
    const offers = results
      .filter((r): r is PromiseFulfilledResult<SswQuoteResult> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)

    return NextResponse.json({ data: offers })
  } catch (err) {
    console.error('Erro na rota SSW:', err)
    return NextResponse.json({ error: 'Erro interno ao consultar SSW.' }, { status: 500 })
  }
}
