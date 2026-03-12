import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é um especialista em leitura de notas fiscais brasileiras (NF-e).
Analise a imagem da nota fiscal e extraia as seguintes informações:

1. Peso total da carga (em kg) — procure por "Peso Bruto", "Peso Liq.", "Peso Total" ou campos similares
2. Valor total da NF (em reais) — procure por "Valor Total da Nota", "Total da NF" ou campo similar
3. Quantidade de volumes/itens — procure por "Qtd Vol.", "Quantidade de Volumes" ou campo similar

Responda APENAS com um JSON válido neste formato exato:
{
  "weight": 10.5,
  "invoiceValue": 1500.00,
  "quantity": 3,
  "confidence": "high" | "medium" | "low",
  "notes": "observação opcional sobre o que foi encontrado"
}

Se não conseguir identificar algum campo, use null para aquele campo.
Confidence: "high" = encontrou todos os campos claramente, "medium" = encontrou com alguma dificuldade, "low" = imagem ilegível ou campos ausentes.`

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'IA não configurada' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Imagem muito grande (máx 10MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Extraia os dados desta nota fiscal.',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'

    let parsed: {
      weight: number | null
      invoiceValue: number | null
      quantity: number | null
      confidence: string
      notes?: string
    }

    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Não foi possível interpretar a imagem' }, { status: 422 })
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (error: unknown) {
    console.error('[AI Read NF]', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
