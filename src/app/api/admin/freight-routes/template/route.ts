import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cnpj = (searchParams.get('cnpj') ?? '').replace(/\D/g, '')

    let companyName = ''
    let cnpjFormatted = cnpj

    if (cnpj.length === 14) {
      cnpjFormatted = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      const admin = createAdminClient()
      const { data: company } = await admin
        .from('companies')
        .select('nome_fantasia, razao_social, name')
        .eq('cnpj', cnpj)
        .single()
      if (company) {
        companyName = company.nome_fantasia || company.razao_social || company.name || ''
      }
    }

    const wb = XLSX.utils.book_new()

    // ── Aba INFO ──────────────────────────────────────────────────────────────
    const infoData = [
      ['CAMPO', 'VALOR', 'OBSERVAÇÃO'],
      ['CNPJ', cnpjFormatted || 'PREENCHA SEU CNPJ', 'NÃO ALTERE — identifica sua empresa automaticamente'],
      ['NOME_TRANSPORTADORA', companyName || 'PREENCHA O NOME DA EMPRESA', 'Nome fantasia ou razão social'],
      ['VIGENCIA_INICIO', '', 'Ex: 01/04/2026'],
      ['VIGENCIA_FIM', '', 'Ex: 31/03/2027'],
    ]
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
    wsInfo['!cols'] = [{ wch: 22 }, { wch: 35 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, wsInfo, 'INFO')

    // ── Aba ROTAS ─────────────────────────────────────────────────────────────
    const rotasHeader = [
      'ORIGEM_UF',
      'ORIGEM_CEP_INICIO',
      'ORIGEM_CEP_FIM',
      'DESTINO_UF',
      'DESTINO_CEP_INICIO',
      'DESTINO_CEP_FIM',
      'PRECO_POR_KG',
      'PRECO_MINIMO',
      'PRAZO_DIAS_UTEIS',
      'PESO_MIN_KG',
      'PESO_MAX_KG',
    ]
    const rotasExemplo = [
      ['SP', '01000000', '19999999', 'MG', '30000000', '39999999', '2.15', '45.00', '3', '', ''],
      ['SP', '01000000', '19999999', 'RJ', '20000000', '28999999', '1.95', '38.00', '2', '', ''],
      ['SP', '01000000', '14999999', 'BA', '40000000', '48999999', '3.40', '65.00', '5', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
    ]
    const rotasData = [rotasHeader, ...rotasExemplo]
    const wsRotas = XLSX.utils.aoa_to_sheet(rotasData)
    wsRotas['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 16 },
      { wch: 12 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 12 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, wsRotas, 'ROTAS')

    // ── Aba TAXAS ─────────────────────────────────────────────────────────────
    const taxasHeader = [
      'ORIGEM_UF',
      'DESTINO_UF',
      'GRIS_PERCENT',
      'SEGURO_PERCENT',
      'PEDAGIO_POR_100KG',
      'TAXA_DESPACHO',
      'ICMS_PERCENT',
    ]
    const taxasExemplo = [
      ['SP', 'MG', '0.30', '0.15', '8.50', '12.00', '12.00'],
      ['SP', 'RJ', '0.30', '0.15', '6.00', '12.00', '12.00'],
      ['', '', '', '', '', '', ''],
    ]
    const taxasData = [taxasHeader, ...taxasExemplo]
    const wsTaxas = XLSX.utils.aoa_to_sheet(taxasData)
    wsTaxas['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 16 }, { wch: 18 }, { wch: 15 }, { wch: 13 },
    ]
    XLSX.utils.book_append_sheet(wb, wsTaxas, 'TAXAS')

    // ── Aba INSTRUCOES ────────────────────────────────────────────────────────
    const instrData = [
      ['INSTRUÇÕES DE PREENCHIMENTO'],
      [''],
      ['Aba ROTAS — preencha uma linha por faixa de atendimento:'],
      ['  ORIGEM_UF / DESTINO_UF: sigla do estado (SP, RJ, MG, ...). Deixe vazio se usar CEP direto.'],
      ['  ORIGEM_CEP_INICIO / FIM: faixa de CEP de origem (8 dígitos, sem traço). Ex: 01000000'],
      ['  DESTINO_CEP_INICIO / FIM: faixa de CEP de destino (8 dígitos, sem traço). Ex: 30000000'],
      ['  Se só UF: deixe CEP vazio. Se só CEP: deixe UF vazio.'],
      ['  PRECO_POR_KG: use ponto como separador decimal. Ex: 2.15'],
      ['  PRECO_MINIMO: valor mínimo em reais. Ex: 45.00'],
      ['  PRAZO_DIAS_UTEIS: número inteiro. Ex: 3'],
      ['  PESO_MIN_KG / PESO_MAX_KG: opcional. Deixe vazio se não houver limite.'],
      [''],
      ['Aba TAXAS — opcional, preencha taxas adicionais por rota:'],
      ['  GRIS_PERCENT: percentual sobre valor NF. Ex: 0.30 = 0,30%'],
      ['  SEGURO_PERCENT: percentual sobre valor NF. Ex: 0.15'],
      ['  PEDAGIO_POR_100KG: valor por fração de 100kg. Ex: 8.50'],
      ['  TAXA_DESPACHO: valor fixo por frete. Ex: 12.00'],
      ['  ICMS_PERCENT: % de ICMS por dentro. Ex: 12.00'],
      [''],
      ['⚠️ IMPORTANTE:'],
      ['  Não altere o CNPJ e o NOME_TRANSPORTADORA na aba INFO.'],
      ['  Esses dados identificam sua empresa automaticamente no sistema.'],
      [''],
      ['📧 Envie o arquivo preenchido para: frete@rotaclick.com.br'],
      ['📱 Ou pelo WhatsApp: (11) 3514-2933'],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData)
    wsInstr['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, 'INSTRUÇÕES')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const safeName = companyName
      ? companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
      : 'transportadora'
    const filename = `tabela_frete_rotaclick_${safeName}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[template]', error)
    return NextResponse.json({ error: 'Erro ao gerar template' }, { status: 500 })
  }
}
