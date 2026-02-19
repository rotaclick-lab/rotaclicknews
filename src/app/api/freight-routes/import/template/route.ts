import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const TEMPLATE_HEADERS = [
  'Origem',
  'Destino',
  'Prazo Entrega (Dias úteis)',
  '0 a 30kg',
  '31 a 50kg',
  '51 a 70kg',
  '71 a 100kg',
  'Acima de 101kg R$/kg',
  'Taxa Despacho',
  'GRIS',
  'Seguro',
  'Pedágio R$100kg ou fração',
  'ICMS',
]

const SAMPLE_ROW = [
  '01000-000',
  '20000-000',
  3,
  45.9,
  62.4,
  78.1,
  95,
  1.25,
  12,
  0.3,
  0.2,
  3.5,
  12,
]

export async function GET() {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, SAMPLE_ROW])

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 24 },
    { wch: 10 },
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo-tabela-frete-rotaclick.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}
