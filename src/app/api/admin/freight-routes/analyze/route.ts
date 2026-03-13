import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Tabela oficial de faixas de CEP por UF (Correios)
const CEP_UF_TABLE = `
UF  | CEP_INICIO | CEP_FIM
SP  | 01000000   | 19999999
RJ  | 20000000   | 28999999
ES  | 29000000   | 29999999
MG  | 30000000   | 39999999
BA  | 40000000   | 48999999
SE  | 49000000   | 49999999
PE  | 50000000   | 56999999
AL  | 57000000   | 57999999
PB  | 58000000   | 58999999
RN  | 59000000   | 59999999
CE  | 60000000   | 63999999
PI  | 64000000   | 64999999
MA  | 65000000   | 65999999
PA  | 66000000   | 68899999
AP  | 68900000   | 68999999
AM  | 69000000   | 69299999
RR  | 69300000   | 69399999
AM  | 69400000   | 69899999
AC  | 69900000   | 69999999
DF  | 70000000   | 73699999
GO  | 73700000   | 76799999
RO  | 76800000   | 76999999
TO  | 77000000   | 77999999
MT  | 78000000   | 78999999
MS  | 79000000   | 79999999
PR  | 80000000   | 87999999
SC  | 88000000   | 89999999
RS  | 90000000   | 99999999
`

const BASE_PROMPT = `Você é um especialista em tabelas de frete brasileiras.
Analise os dados desta tabela de frete e extraia TODAS as linhas/faixas de preço.

## TABELA DE REFERÊNCIA — FAIXAS DE CEP POR ESTADO (use obrigatoriamente):
${CEP_UF_TABLE}

## REGRAS CRÍTICAS para origin_zip / origin_zip_end / dest_zip / dest_zip_end:

1. QUANDO o campo indica um ESTADO INTEIRO (ex: "SP", "São Paulo", "ORIGEM_UF=SP"):
   - Use SEMPRE a faixa COMPLETA do estado da tabela de referência acima
   - Exemplo: SP → origin_zip="01000000", origin_zip_end="19999999"
   - NUNCA use um CEP central representativo

2. QUANDO indica um estado COM EXCLUSÃO (ex: "SP exceto interior", "SP exceto 15000-19999"):
   - Gere MÚLTIPLAS linhas cobrindo as sub-faixas não excluídas
   - Exemplo "SP exceto 15000000-19999999":
     → Linha 1: origin_zip="01000000", origin_zip_end="14999999"
     (não há linha 2 pois 15000000-19999999 foi excluído)

3. QUANDO indica uma faixa explícita de CEP (ex: "01000-000 a 09999-999"):
   - origin_zip="01000000", origin_zip_end="09999999"

4. QUANDO indica um CEP único (ex: "05432-001"):
   - origin_zip="05432001", origin_zip_end=null

5. Se o arquivo vier no formato do TEMPLATE ROTACLICK (abas INFO, ROTAS, TAXAS):
   - Aba INFO: extraia CNPJ do campo CNPJ e nome do campo NOME_TRANSPORTADORA
   - Aba ROTAS: mapeie colunas diretamente: ORIGEM_UF→origin_label, ORIGEM_CEP_INICIO→origin_zip,
     ORIGEM_CEP_FIM→origin_zip_end, DESTINO_UF→dest_label, DESTINO_CEP_INICIO→dest_zip,
     DESTINO_CEP_FIM→dest_zip_end, PRECO_POR_KG→price_per_kg, PRECO_MINIMO→min_price,
     PRAZO_DIAS_UTEIS→deadline_days, PESO_MIN_KG→weight_min, PESO_MAX_KG→weight_max
   - Se ORIGEM_CEP_INICIO estiver vazio mas ORIGEM_UF preenchida, use a tabela de referência acima

## CAMPOS A EXTRAIR por linha:
- carrier_cnpj: CNPJ da transportadora encontrado na tabela (somente dígitos). null se não encontrar.
- carrier_name: nome da transportadora encontrado. null se não encontrar.
- origin_zip: CEP inicial de origem (8 dígitos, sem traço). OBRIGATÓRIO.
- origin_zip_end: CEP final de origem (8 dígitos). null só se for CEP único.
- dest_zip: CEP inicial de destino (8 dígitos, sem traço). OBRIGATÓRIO.
- dest_zip_end: CEP final de destino (8 dígitos). null só se for CEP único.
- origin_label: texto original de origem (ex: "SP", "SP Capital", "01000-099")
- dest_label: texto original de destino (ex: "MG", "Belo Horizonte")
- price_per_kg: preço por kg em reais (número decimal). null se não encontrar.
- min_price: valor mínimo de frete em reais. null se não encontrar.
- deadline_days: prazo em dias úteis (inteiro). 3 se não encontrar.
- weight_min: peso mínimo em kg. null se não aplicável.
- weight_max: peso máximo em kg. null se não aplicável.

Responda APENAS com JSON válido neste formato:
{
  "carrier_cnpj": "12345678000190",
  "carrier_name": "nome da transportadora ou null",
  "rows": [
    {
      "origin_zip": "01000000",
      "origin_zip_end": "19999999",
      "dest_zip": "30000000",
      "dest_zip_end": "39999999",
      "origin_label": "SP",
      "dest_label": "MG",
      "price_per_kg": 1.85,
      "min_price": 45.00,
      "deadline_days": 3,
      "weight_min": null,
      "weight_max": null
    }
  ],
  "confidence": "high",
  "notes": "observação opcional"
}

Nunca invente dados. Se não conseguir extrair uma linha, omita-a. Responda APENAS com o JSON.`

function isImageType(mime: string, name: string): boolean {
  if (mime.startsWith('image/')) return true
  const ext = name.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext ?? '')
}

function isPdfType(mime: string, name: string): boolean {
  if (mime === 'application/pdf') return true
  return name.split('.').pop()?.toLowerCase() === 'pdf'
}

function isSpreadsheetType(mime: string, name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  return ['xls', 'xlsx', 'csv', 'txt', 'tsv', 'ods'].includes(ext ?? '') ||
    mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv' || mime === 'text/plain'
}

function spreadsheetToText(buffer: Buffer, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'csv' || ext === 'txt' || ext === 'tsv') {
    return buffer.toString('utf-8')
  }

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const lines: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false })
    if (csv.trim()) {
      lines.push(`=== Aba: ${sheetName} ===`)
      lines.push(csv)
    }
  }

  return lines.join('\n')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || ''
    const fileName = file.name || ''

    let completion

    if (isSpreadsheetType(mimeType, fileName)) {
      const tableText = spreadsheetToText(buffer, fileName)
      if (!tableText.trim()) {
        return NextResponse.json({ error: 'Arquivo vazio ou não foi possível ler o conteúdo' }, { status: 422 })
      }

      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `${BASE_PROMPT}\n\nDados da tabela:\n\`\`\`\n${tableText.slice(0, 30000)}\n\`\`\``,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
    } else if (isImageType(mimeType, fileName) || isPdfType(mimeType, fileName)) {
      const base64 = buffer.toString('base64')
      const imageMime = isPdfType(mimeType, fileName) ? 'image/png' : (mimeType || 'image/png')

      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: BASE_PROMPT },
              { type: 'image_url', image_url: { url: `data:${imageMime};base64,${base64}`, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
    } else {
      const tableText = buffer.toString('utf-8')
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `${BASE_PROMPT}\n\nDados da tabela:\n\`\`\`\n${tableText.slice(0, 30000)}\n\`\`\``,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
    }

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    let extracted: {
      carrier_cnpj: string | null
      carrier_name: string | null
      rows: Array<{
        origin_zip: string
        origin_zip_end: string | null
        dest_zip: string
        dest_zip_end: string | null
        origin_label: string
        dest_label: string
        price_per_kg: number | null
        min_price: number | null
        deadline_days: number
        weight_min: number | null
        weight_max: number | null
      }>
      confidence: string
      notes?: string
    }

    try {
      extracted = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Não foi possível interpretar a tabela' }, { status: 422 })
    }

    if (!extracted.rows?.length) {
      return NextResponse.json({ error: 'Nenhuma faixa de frete encontrada no arquivo' }, { status: 422 })
    }

    // Identificar transportadora automaticamente pelo CNPJ extraído
    let detectedCarrier: { id: string; name: string; user_id: string | null } | null = null
    const cnpjFromFile = (extracted.carrier_cnpj ?? '').replace(/\D/g, '')
    if (cnpjFromFile.length === 14) {
      const { data: companyByCnpj } = await admin
        .from('companies')
        .select('id, nome_fantasia, razao_social, name')
        .eq('cnpj', cnpjFromFile)
        .single()
      if (companyByCnpj) {
        const { data: profileByCnpj } = await admin
          .from('profiles')
          .select('id')
          .eq('company_id', companyByCnpj.id)
          .eq('role', 'transportadora')
          .single()
        detectedCarrier = {
          id: companyByCnpj.id,
          name: companyByCnpj.nome_fantasia || companyByCnpj.razao_social || companyByCnpj.name || '',
          user_id: profileByCnpj?.id ?? null,
        }
      }
    }

    // Buscar rotas do mercado para comparação
    const { data: marketRoutes } = await admin
      .from('freight_routes')
      .select('origin_zip, dest_zip, price_per_kg, min_price, cost_price_per_kg, margin_percent')
      .eq('is_active', true)
      .limit(500)

    // Calcular média de mercado por pair origem/destino aproximado
    const marketAvg = new Map<string, { prices: number[], count: number }>()
    for (const r of marketRoutes ?? []) {
      const key = `${r.origin_zip?.slice(0, 3)}-${r.dest_zip?.slice(0, 3)}`
      if (!marketAvg.has(key)) marketAvg.set(key, { prices: [], count: 0 })
      if (r.price_per_kg) {
        marketAvg.get(key)!.prices.push(r.price_per_kg)
        marketAvg.get(key)!.count++
      }
    }

    // Para cada linha, calcular sugestão de margem
    const rowsWithSuggestion = extracted.rows.map((row) => {
      const key = `${row.origin_zip?.slice(0, 3)}-${row.dest_zip?.slice(0, 3)}`
      const market = marketAvg.get(key)
      const avgMarketPrice = market?.prices.length
        ? market.prices.reduce((a, b) => a + b, 0) / market.prices.length
        : null

      let suggested_markup_pct: number | null = null
      let suggested_discount_pct: number | null = null
      let market_avg_price: number | null = null
      let market_comparison: string = 'sem dados de mercado'

      if (avgMarketPrice && row.price_per_kg) {
        market_avg_price = avgMarketPrice
        const diff = ((row.price_per_kg - avgMarketPrice) / avgMarketPrice) * 100

        if (diff < -20) {
          suggested_markup_pct = 35
          suggested_discount_pct = null
          market_comparison = `${Math.abs(diff).toFixed(0)}% abaixo da média — margem alta sugerida`
        } else if (diff < -10) {
          suggested_markup_pct = 25
          suggested_discount_pct = null
          market_comparison = `${Math.abs(diff).toFixed(0)}% abaixo da média — boa margem`
        } else if (diff < 0) {
          suggested_markup_pct = 20
          suggested_discount_pct = null
          market_comparison = `${Math.abs(diff).toFixed(0)}% abaixo da média — margem padrão`
        } else if (diff < 10) {
          suggested_markup_pct = 15
          suggested_discount_pct = 5
          market_comparison = `Na média do mercado — margem moderada`
        } else {
          suggested_markup_pct = 10
          suggested_discount_pct = 10
          market_comparison = `${diff.toFixed(0)}% acima da média — margem conservadora`
        }
      } else {
        suggested_markup_pct = 20
        market_comparison = 'Sem dados comparáveis — margem padrão 20%'
      }

      return {
        ...row,
        market_avg_price,
        suggested_markup_pct,
        suggested_discount_pct,
        market_comparison,
      }
    })

    return NextResponse.json({
      success: true,
      carrier_cnpj: cnpjFromFile || null,
      carrier_name: extracted.carrier_name,
      detected_carrier: detectedCarrier,
      confidence: extracted.confidence,
      notes: extracted.notes,
      rows: rowsWithSuggestion,
    })
  } catch (error: unknown) {
    console.error('[Analyze Freight Table]', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
