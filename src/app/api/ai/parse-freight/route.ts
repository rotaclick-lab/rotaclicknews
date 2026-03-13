import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é um especialista em logística brasileira. O usuário vai descrever um frete em linguagem natural.
Extraia as informações logísticas e retorne APENAS um JSON válido.

Campos a extrair:
- originCep: CEP de origem (8 dígitos numéricos, sem traço). Se mencionar cidade/estado sem CEP, tente inferir um CEP central da cidade. Ex: São Paulo SP → "01310100", Belo Horizonte MG → "30130110", Curitiba PR → "80010010", Rio de Janeiro RJ → "20040020", Porto Alegre RS → "90010120"
- destCep: CEP de destino (8 dígitos numéricos, sem traço). Mesma lógica acima.
- weight: peso em kg (número decimal)
- invoiceValue: valor da nota fiscal em reais (número decimal)
- category: categoria da carga — use EXATAMENTE um destes valores se identificar: "eletronicos", "alimentos", "moveis", ou null se não identificar
- confidence: "high" se extraiu com clareza, "medium" se inferiu, "low" se não conseguiu

Formato de resposta:
{
  "originCep": "01310100" | null,
  "destCep": "30130110" | null,
  "weight": 30.0 | null,
  "invoiceValue": 2000.00 | null,
  "category": "eletronicos" | null,
  "confidence": "high" | "medium" | "low",
  "notes": "observação opcional"
}

Se não conseguir identificar um campo, use null.
Nunca invente CEPs sem base na cidade mencionada.
Responda APENAS com o JSON válido, sem markdown.`

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'IA não configurada' }, { status: 500 })
  }

  try {
    const { freeText } = await request.json() as { freeText: string }

    if (!freeText?.trim()) {
      return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: freeText.trim() },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    console.log('[AI Parse Freight] raw:', raw)

    let parsed: {
      originCep: string | null
      destCep: string | null
      weight: number | null
      invoiceValue: number | null
      category: string | null
      confidence: string
      notes?: string
    }

    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('[AI Parse Freight] JSON parse failed:', raw)
      return NextResponse.json({ error: 'Não foi possível interpretar o texto' }, { status: 422 })
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (error: unknown) {
    console.error('[AI Parse Freight] error:', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
