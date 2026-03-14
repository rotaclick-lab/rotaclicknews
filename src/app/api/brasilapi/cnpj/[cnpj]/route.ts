import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { cnpj: string } }
) {
  const digits = params.cnpj.replace(/\D/g, '')
  if (digits.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'RotaClick/1.0' }
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 })
    }

    const data = await res.json()
    return NextResponse.json({
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: data.cep,
      ddd_telefone_1: data.ddd_telefone_1,
      email: data.email,
    })
  } catch (err) {
    console.error('Erro BrasilAPI CNPJ:', err)
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
