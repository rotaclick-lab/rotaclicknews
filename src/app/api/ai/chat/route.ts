import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é a assistente de cotação de frete da RotaClick, uma plataforma brasileira de logística. Seu nome é "Rota" e você é simpática, objetiva e eficiente.

Seu objetivo é coletar as informações necessárias para fazer uma cotação de frete e retornar esses dados de forma estruturada.

## Informações que você precisa coletar (em ordem):
1. **Nome completo** do remetente
2. **E-mail** do remetente
3. **Telefone/WhatsApp** com DDD — ao pedir, use sempre a palavra "telefone" ou "WhatsApp" na mensagem. Aceite qualquer formato com pelo menos 10 dígitos numéricos.
4. **CEP de origem** (apenas números, 8 dígitos)
5. **CEP de destino** (apenas números, 8 dígitos)
6. **Peso da carga** em kg
7. **Valor da nota fiscal** em reais

## Regras importantes:
- Colete UMA informação por vez, de forma conversacional e natural
- Quando o usuário fornecer múltiplas informações de uma vez, aceite todas
- Para telefone: aceite QUALQUER formato que tenha 10 ou 11 dígitos numéricos. Não rejeite por causa de formatação.
- Valide os dados: CEP deve ter 8 dígitos, e-mail deve ter @
- Se o dado for inválido, peça novamente de forma gentil
- Seja breve nas perguntas — máximo 2 linhas
- Após coletar TODAS as 7 informações, retorne um JSON estruturado no campo "action"

## Formato de resposta:
Sempre responda em JSON com este formato:
{
  "message": "sua mensagem para o usuário",
  "field": "name" | "email" | "phone" | "originCep" | "destCep" | "weight" | "invoiceValue" | null,
  "action": null | {
    "type": "fill_form",
    "data": {
      "name": "Nome Completo",
      "email": "email@exemplo.com",
      "phone": "(11) 99999-9999",
      "originCep": "01310100",
      "destCep": "30130110",
      "weight": 10.5,
      "invoiceValue": 1500.00
    }
  }
}

O campo "field" indica qual informação você está coletando AGORA. Use null quando não estiver coletando nada.
Só inclua "action" com os dados quando tiver coletado TODAS as 7 informações com sucesso.
Nunca inclua markdown fora do JSON. Responda APENAS com o JSON válido.`

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'IA não configurada' }, { status: 500 })
  }

  try {
    const { messages } = await request.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const raw = (completion.choices[0]?.message?.content ?? '').trim()
    console.log('[AI Chat] raw response:', raw)

    let parsed: { message: string; field?: string | null; action: null | { type: string; data: Record<string, unknown> } }

    if (!raw) {
      console.error('[AI Chat] empty response from OpenAI')
      return NextResponse.json({ success: true, message: 'Desculpe, não recebi resposta. Pode repetir?', field: null, action: null })
    }

    try {
      parsed = JSON.parse(raw)
      if (!parsed.message) throw new Error('missing message field')
      console.log('[AI Chat] field:', parsed.field, '| message:', parsed.message?.slice(0, 80))
    } catch {
      console.error('[AI Chat] JSON parse failed:', raw)
      parsed = { message: 'Desculpe, tive um problema. Pode repetir?', field: null, action: null }
    }

    return NextResponse.json({ success: true, ...parsed })
  } catch (error: unknown) {
    console.error('[AI Chat]', error)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
