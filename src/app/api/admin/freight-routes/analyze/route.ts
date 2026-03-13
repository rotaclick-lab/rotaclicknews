import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const EXTRACT_PROMPT = `Você é um especialista em tabelas de frete brasileiras.
Analise a imagem desta tabela de frete e extraia TODAS as linhas/faixas de preço.

Para cada linha extraia:
- origin_zip: CEP inicial de origem (8 dígitos, sem traço). Se for UF/cidade, use o CEP central.
- origin_zip_end: CEP final de origem (se for faixa). Pode ser null.
- dest_zip: CEP inicial de destino (8 dígitos, sem traço).
- dest_zip_end: CEP final de destino (se for faixa). Pode ser null.
- origin_label: texto original de origem (ex: "SP Capital", "01000-099")
- dest_label: texto original de destino (ex: "MG", "Belo Horizonte")
- price_per_kg: preço por kg em reais (número decimal). Se não encontrar, use null.
- min_price: valor mínimo de frete em reais (número decimal). Se não encontrar, use null.
- deadline_days: prazo em dias úteis (inteiro). Se não encontrar, use 3.
- weight_min: peso mínimo em kg para esta faixa. Pode ser null.
- weight_max: peso máximo em kg para esta faixa. Pode ser null.

Responda APENAS com JSON válido neste formato:
{
  "carrier_name": "nome da transportadora se visível na tabela, ou null",
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
  "confidence": "high" | "medium" | "low",
  "notes": "observação opcional"
}

Se não conseguir extrair uma linha, omita-a.
Nunca invente dados. Responda APENAS com o JSON.`

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
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/png'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACT_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    let extracted: {
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
      return NextResponse.json({ error: 'Nenhuma faixa de frete encontrada na imagem' }, { status: 422 })
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
      carrier_name: extracted.carrier_name,
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
