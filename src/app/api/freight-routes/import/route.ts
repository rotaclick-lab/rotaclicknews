import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/app/api/rate-limit'
import { cepToUf, ufToRegion } from '@/lib/cep-to-uf'

const VALID_UFS = new Set([
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
])

function parseZipField(value: string): { zip: string; uf: string | null; region: string | null } {
  const trimmed = value.trim().toUpperCase()
  const digits = trimmed.replace(/\D/g, '')

  // UF válida (ex: "SP", "BA")
  if (VALID_UFS.has(trimmed)) {
    return { zip: trimmed, uf: trimmed, region: ufToRegion(trimmed) }
  }

  // CEP completo 8 dígitos
  if (digits.length === 8) {
    const uf = cepToUf(digits)
    return { zip: digits, uf, region: uf ? ufToRegion(uf) : null }
  }

  // Prefixo de CEP (3–7 dígitos)
  if (digits.length >= 3 && digits.length < 8) {
    const padded = digits.padEnd(8, '0')
    const uf = cepToUf(padded)
    return { zip: digits, uf, region: uf ? ufToRegion(uf) : null }
  }

  return { zip: trimmed, uf: null, region: null }
}

type ParsedFreightRow = {
  sourceRow: number
  origin: string
  destination: string
  deadlineDays: number
  weight0to30: number
  weight31to50: number
  weight51to70: number
  weight71to100: number
  above101PerKg: number
  dispatchFee: number
  grisPercent: number
  insurancePercent: number
  tollPer100kg: number
  icmsPercent: number
}

type RowError = {
  sourceRow: number
  message: string
}

const COLUMN_ALIASES: Record<keyof Omit<ParsedFreightRow, 'sourceRow'>, string[]> = {
  origin: ['origem'],
  destination: ['destino'],
  deadlineDays: ['prazoentregadiasuteis', 'prazoentrega', 'prazo'],
  weight0to30: ['0a30kg', '0-30kg'],
  weight31to50: ['31a50kg', '31-50kg'],
  weight51to70: ['51a70kg', '51-70kg'],
  weight71to100: ['71a100kg', '71-100kg'],
  above101PerKg: ['acimade101kgrkg', 'acimade101kgrskg', 'acimade101kg', 'acimade101'],
  dispatchFee: ['taxadespacho'],
  grisPercent: ['gris'],
  insurancePercent: ['seguro'],
  tollPer100kg: ['pedagior100kgoufracao', 'pedagio'],
  icmsPercent: ['icms'],
}

function normalizeCell(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function parseBrazilNumber(value: unknown): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  const sanitized = raw
    .replace(/r\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(sanitized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInteger(value: unknown): number | null {
  const parsed = parseBrazilNumber(value)
  if (parsed === null) return null
  const intVal = Math.round(parsed)
  return Number.isFinite(intVal) ? intVal : null
}

/** Retorna somente dígitos do CEP, ou o valor original se não for numérico (ex: UF) */
function normalizeCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 7) return '0' + digits
  if (digits.length >= 3) return digits
  return value.trim().toUpperCase()
}

function findHeaderRow(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    const normalized = row.map(normalizeCell)

    const hasOrigin = normalized.some((value) => COLUMN_ALIASES.origin.includes(value))
    const hasDestination = normalized.some((value) => COLUMN_ALIASES.destination.includes(value))
    const hasDeadline = normalized.some((value) =>
      COLUMN_ALIASES.deadlineDays.some((alias) => value.includes(alias))
    )

    if (hasOrigin && hasDestination && hasDeadline) {
      return { index: i, normalized }
    }
  }

  return null
}

function resolveColumnIndex(normalizedHeader: string[], aliases: string[]) {
  return normalizedHeader.findIndex((value) => aliases.some((alias) => value.includes(alias)))
}

function isStopOrNoiseRow(row: unknown[]) {
  const joined = row.map((cell) => String(cell ?? '').toLowerCase()).join(' ')
  return joined.includes('calculo frete') || joined.includes('pode alterar o valor da nf')
}

function parseSheetRows(rows: unknown[][]) {
  const headerInfo = findHeaderRow(rows)
  if (!headerInfo) {
    return {
      parsedRows: [] as ParsedFreightRow[],
      errors: [{ sourceRow: 0, message: 'Cabeçalho da tabela de frete não encontrado no arquivo.' }] as RowError[],
    }
  }

  const requiredKeys = Object.keys(COLUMN_ALIASES) as Array<keyof Omit<ParsedFreightRow, 'sourceRow'>>

  const columnIndexByKey = requiredKeys.reduce((acc, key) => {
    acc[key] = resolveColumnIndex(headerInfo.normalized, COLUMN_ALIASES[key])
    return acc
  }, {} as Record<keyof Omit<ParsedFreightRow, 'sourceRow'>, number>)

  const missingColumns = requiredKeys.filter((key) => columnIndexByKey[key] < 0)
  if (missingColumns.length > 0) {
    return {
      parsedRows: [] as ParsedFreightRow[],
      errors: [
        {
          sourceRow: headerInfo.index + 1,
          message: `Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`,
        },
      ] as RowError[],
    }
  }

  const parsedRows: ParsedFreightRow[] = []
  const errors: RowError[] = []

  for (let i = headerInfo.index + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    const sourceRow = i + 1

    if (isStopOrNoiseRow(row)) {
      break
    }

    const origin = String(row[columnIndexByKey.origin] ?? '').trim()
    const destination = String(row[columnIndexByKey.destination] ?? '').trim()

    if (!origin && !destination) {
      continue
    }

    const deadlineDays = parseInteger(row[columnIndexByKey.deadlineDays])
    const weight0to30 = parseBrazilNumber(row[columnIndexByKey.weight0to30])
    const weight31to50 = parseBrazilNumber(row[columnIndexByKey.weight31to50])
    const weight51to70 = parseBrazilNumber(row[columnIndexByKey.weight51to70])
    const weight71to100 = parseBrazilNumber(row[columnIndexByKey.weight71to100])
    const above101PerKg = parseBrazilNumber(row[columnIndexByKey.above101PerKg])
    const dispatchFee = parseBrazilNumber(row[columnIndexByKey.dispatchFee])
    const grisPercent = parseBrazilNumber(row[columnIndexByKey.grisPercent])
    const insurancePercent = parseBrazilNumber(row[columnIndexByKey.insurancePercent])
    const tollPer100kg = parseBrazilNumber(row[columnIndexByKey.tollPer100kg])
    const icmsPercent = parseBrazilNumber(row[columnIndexByKey.icmsPercent])

    const missingValues: string[] = []
    if (!origin) missingValues.push('origem')
    if (!destination) missingValues.push('destino')
    if (deadlineDays === null) missingValues.push('prazo')
    if (weight0to30 === null) missingValues.push('0-30kg')
    if (weight31to50 === null) missingValues.push('31-50kg')
    if (weight51to70 === null) missingValues.push('51-70kg')
    if (weight71to100 === null) missingValues.push('71-100kg')
    if (above101PerKg === null) missingValues.push('acima 101kg')
    if (dispatchFee === null) missingValues.push('taxa despacho')
    if (grisPercent === null) missingValues.push('GRIS')
    if (insurancePercent === null) missingValues.push('seguro')
    if (tollPer100kg === null) missingValues.push('pedágio')
    if (icmsPercent === null) missingValues.push('ICMS')

    if (missingValues.length > 0) {
      errors.push({
        sourceRow,
        message: `Valores inválidos/ausentes em: ${missingValues.join(', ')}`,
      })
      continue
    }

    parsedRows.push({
      sourceRow,
      origin,
      destination,
      deadlineDays: deadlineDays as number,
      weight0to30: weight0to30 as number,
      weight31to50: weight31to50 as number,
      weight51to70: weight51to70 as number,
      weight71to100: weight71to100 as number,
      above101PerKg: above101PerKg as number,
      dispatchFee: dispatchFee as number,
      grisPercent: grisPercent as number,
      insurancePercent: insurancePercent as number,
      tollPer100kg: tollPer100kg as number,
      icmsPercent: icmsPercent as number,
    })
  }

  return { parsedRows, errors }
}

export async function POST(request: Request) {
  const limited = rateLimit(request as any, 10)
  if (limited) return limited

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Arquivo não enviado' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      raw: false,
      cellDates: false,
      dense: false,
    })

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ success: false, error: 'Planilha vazia' }, { status: 400 })
    }

    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      return NextResponse.json({ success: false, error: 'Aba principal da planilha não encontrada.' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }) as unknown[][]

    const { parsedRows, errors } = parseSheetRows(rows)

    if (parsedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma linha válida encontrada para importação.',
          data: {
            imported_count: 0,
            invalid_count: errors.length,
            errors,
          },
        },
        { status: 400 }
      )
    }

    const payload = parsedRows.map((row) => {
      const origin = parseZipField(row.origin)
      const dest = parseZipField(row.destination)
      return {
        carrier_id: user.id,
        origin_zip: origin.zip,
        dest_zip: dest.zip,
        origin_uf: origin.uf,
        dest_uf: dest.uf,
        origin_region: origin.region,
        dest_region: dest.region,
        price_per_kg: row.above101PerKg,
        min_price: row.weight0to30,
        deadline_days: row.deadlineDays,
        source_file: file.name,
        imported_at: new Date().toISOString(),
        is_active: true,
        rate_card: {
          weight_0_30: row.weight0to30,
          weight_31_50: row.weight31to50,
          weight_51_70: row.weight51to70,
          weight_71_100: row.weight71to100,
          above_101_per_kg: row.above101PerKg,
          dispatch_fee: row.dispatchFee,
          gris_percent: row.grisPercent,
          insurance_percent: row.insurancePercent,
          toll_per_100kg: row.tollPer100kg,
          icms_percent: row.icmsPercent,
        },
      }
    })

    const { error: insertError } = await supabase.from('freight_routes').insert(payload)

    if (insertError) {
      console.error('Erro ao importar tabela de frete:', insertError)
      return NextResponse.json(
        { success: false, error: 'Não foi possível salvar as linhas importadas.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        imported_count: parsedRows.length,
        invalid_count: errors.length,
        errors,
      },
    })
  } catch (error) {
    console.error('Erro inesperado na importação de tabela de frete:', error)
    return NextResponse.json({ success: false, error: 'Erro ao processar arquivo de importação.' }, { status: 500 })
  }
}
