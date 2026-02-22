import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RowError = { sourceRow: number; message: string }

const COLUMN_ALIASES: Record<string, string[]> = {
  origin:       ['origem'],
  destination:  ['destino'],
  deadlineDays: ['prazoentregadiasuteis', 'prazoentrega', 'prazo'],
  weight0to30:  ['0a30kg', '0-30kg'],
  weight31to50: ['31a50kg', '31-50kg'],
  weight51to70: ['51a70kg', '51-70kg'],
  weight71to100:['71a100kg', '71-100kg'],
  above101PerKg:['acimade101kgrkg', 'acimade101kgrskg', 'acimade101kg', 'acimade101'],
  dispatchFee:  ['taxadespacho'],
  grisPercent:  ['gris'],
  insurancePercent: ['seguro'],
  tollPer100kg: ['pedagior100kgoufracao', 'pedagio'],
  icmsPercent:  ['icms'],
}

function normalizeCell(v: unknown) {
  return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function parseBrazilNumber(v: unknown): number | null {
  const raw = String(v ?? '').trim().replace(/r\$/gi, '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function normalizeCep(v: string) {
  let d = v.replace(/\D/g, '')
  if (d.length === 7) d = '0' + d
  if (d.length !== 8) return v.trim()
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function findHeader(rows: unknown[][]) {
  const originAliases = COLUMN_ALIASES['origin'] ?? []
  const destAliases = COLUMN_ALIASES['destination'] ?? []
  const deadlineAliases = COLUMN_ALIASES['deadlineDays'] ?? []
  for (let i = 0; i < rows.length; i++) {
    const norm = (rows[i] ?? []).map(normalizeCell)
    if (
      norm.some(v => originAliases.includes(v)) &&
      norm.some(v => destAliases.includes(v)) &&
      norm.some(v => deadlineAliases.some(a => v.includes(a)))
    ) return { index: i, norm }
  }
  return null
}

export async function POST(request: Request) {
  // Auth: only admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file')
  const carrierId = String(formData.get('carrier_id') ?? '')
  const marginPercent = Number(formData.get('margin_percent') ?? 20)

  if (!(file instanceof File)) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  if (!carrierId) return NextResponse.json({ error: 'Selecione uma transportadora' }, { status: 400 })

  // Resolve carrier user_id from profiles table
  const admin = createAdminClient()
  const { data: carrierProfile } = await admin.from('profiles').select('id').eq('company_id', carrierId).eq('role', 'transportadora').limit(1).single()
  if (!carrierProfile?.id) return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 })

  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: false, cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, {
    header: 1, raw: false, defval: '', blankrows: false,
  }) as unknown[][]

  const header = findHeader(rows)
  if (!header) return NextResponse.json({ error: 'Cabeçalho não encontrado no arquivo' }, { status: 400 })

  const colIdx = (key: string) => {
    const aliases = COLUMN_ALIASES[key] ?? []
    return header.norm.findIndex(v => aliases.some(a => v.includes(a)))
  }

  const cols = Object.fromEntries(Object.keys(COLUMN_ALIASES).map(k => [k, colIdx(k)]))
  const missing = Object.entries(cols).filter(([, i]) => i < 0).map(([k]) => k)
  if (missing.length > 0) {
    return NextResponse.json({ error: `Colunas ausentes: ${missing.join(', ')}` }, { status: 400 })
  }

  const payload: Record<string, unknown>[] = []
  const errors: RowError[] = []

  for (let i = header.index + 1; i < rows.length; i++) {
    const row = rows[i] ?? []
    const origin = String(row[cols.origin!] ?? '').trim()
    const destination = String(row[cols.destination!] ?? '').trim()
    if (!origin && !destination) continue

    const deadlineDays = parseBrazilNumber(row[cols.deadlineDays!])
    const above101 = parseBrazilNumber(row[cols.above101PerKg!])
    const w0to30 = parseBrazilNumber(row[cols.weight0to30!])

    if (!origin || !destination || deadlineDays === null || above101 === null || w0to30 === null) {
      errors.push({ sourceRow: i + 1, message: `Linha ${i + 1}: dados incompletos (origem, destino, prazo ou preços)` })
      continue
    }

    const costPerKg = above101
    const publishedPerKg = costPerKg * (1 + marginPercent / 100)
    const costMin = w0to30
    const publishedMin = costMin * (1 + marginPercent / 100)

    payload.push({
      carrier_id: carrierProfile.id,
      origin_zip: normalizeCep(origin),
      dest_zip: normalizeCep(destination),
      cost_price_per_kg: costPerKg,
      margin_percent: marginPercent,
      cost_min_price: costMin,
      price_per_kg: publishedPerKg,
      min_price: publishedMin,
      deadline_days: Math.round(deadlineDays),
      is_active: true,
      source_file: file.name,
      imported_at: new Date().toISOString(),
      rate_card: {
        weight_0_30: w0to30,
        weight_31_50: parseBrazilNumber(row[cols.weight31to50!]),
        weight_51_70: parseBrazilNumber(row[cols.weight51to70!]),
        weight_71_100: parseBrazilNumber(row[cols.weight71to100!]),
        above_101_per_kg: above101,
        dispatch_fee: parseBrazilNumber(row[cols.dispatchFee!]),
        gris_percent: parseBrazilNumber(row[cols.grisPercent!]),
        insurance_percent: parseBrazilNumber(row[cols.insurancePercent!]),
        toll_per_100kg: parseBrazilNumber(row[cols.tollPer100kg!]),
        icms_percent: parseBrazilNumber(row[cols.icmsPercent!]),
      },
    })
  }

  if (payload.length === 0) {
    return NextResponse.json({ success: false, error: 'Nenhuma linha válida encontrada', data: { imported_count: 0, errors } }, { status: 400 })
  }

  const { error: insertError } = await admin.from('freight_routes').insert(payload)
  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: { imported_count: payload.length, invalid_count: errors.length, errors, margin_applied: marginPercent },
  })
}
