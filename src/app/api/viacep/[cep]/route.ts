import { NextResponse } from 'next/server'
import { rateLimit } from '@/app/api/rate-limit'
import { buscarCEP } from '@/lib/viacep'

export async function GET(
  request: Request,
  { params }: { params: { cep: string } }
) {
  const limited = rateLimit(request as any, 30)
  if (limited) return limited

  try {
    const cep = params.cep
    
    // Validar formato do CEP
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      return NextResponse.json(
        { error: 'CEP deve ter 8 dígitos' },
        { status: 400 }
      )
    }

    // Buscar informações do CEP
    const dados = await buscarCEP(cep)
    
    if (!dados) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar headers CORS
    const response = NextResponse.json(dados)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar CEP' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}
