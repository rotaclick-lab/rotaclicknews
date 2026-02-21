import { createAdminClient } from '@/lib/supabase/admin'

export interface RntrcCacheRow {
  rntrc: string
  cpf_cnpj: string | null
  razao_social: string | null
  situacao: string
  categoria: string | null
  uf: string | null
  municipio: string | null
  data_atualizacao_antt: string | null
}

function normalizeSituacao(raw: string): string {
  const u = (raw || '').toUpperCase().trim()
  if (['ATIVO', 'ATIVA'].includes(u)) return 'ACTIVE'
  if (['INATIVO', 'INATIVA', 'CANCELADO', 'CANCELADA'].includes(u)) return 'INACTIVE'
  if (['SUSPENSO', 'SUSPENSA'].includes(u)) return 'SUSPENDED'
  if (['EXPIRADO', 'EXPIRADA'].includes(u)) return 'EXPIRED'
  return 'UNKNOWN'
}

function parseCsvLine(line: string, headers: string[]): Record<string, string> {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') inQuotes = !inQuotes
    else if ((c === ',' || c === ';') && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else current += c
  }
  values.push(current.trim().replace(/^"|"$/g, ''))
  const row: Record<string, string> = {}
  headers.forEach((h, i) => {
    row[h] = values[i] ?? ''
  })
  return row
}

function mapRowToCache(row: Record<string, string>): RntrcCacheRow | null {
  const rntrc = (row.RNTRC ?? row.NU_RNTRC ?? row.rntrc ?? row.NumeroRNTRC ?? '').replace(/\D/g, '')
  if (!rntrc || rntrc.length < 8) return null

  const situacaoRaw = row.SG_SITUACAO ?? row.SITUACAO ?? row.situacao ?? row.Situacao ?? 'UNKNOWN'
  return {
    rntrc,
    cpf_cnpj: (row.CPF_CNPJ ?? row.NU_CPF_CNPJ ?? row.cpf_cnpj ?? row.CPFCNPJ ?? '').replace(/\D/g, '') || null,
    razao_social: (row.NO_RAZAO_SOCIAL ?? row.RAZAO_SOCIAL ?? row.razao_social ?? row.Nome ?? '').trim() || null,
    situacao: normalizeSituacao(situacaoRaw),
    categoria: (row.DS_CATEGORIA ?? row.CATEGORIA ?? row.categoria ?? '').trim() || null,
    uf: (row.SG_UF ?? row.UF ?? row.uf ?? '').trim() || null,
    municipio: (row.NO_MUNICIPIO ?? row.MUNICIPIO ?? row.municipio ?? '').trim() || null,
    data_atualizacao_antt: null,
  }
}

export async function ingestRntrcFromCsv(csvText: string, sourceLabel = 'upload_manual'): Promise<{
  success: boolean
  recordsImported: number
  errors: string[]
}> {
  const admin = createAdminClient()
  const errors: string[] = []

  try {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      return { success: false, recordsImported: 0, errors: ['CSV vazio ou inválido'] }
    }

    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0]
      .split(sep)
      .map((h) => h.replace(/^"|"$/g, '').trim())
      .filter(Boolean)

    if (headers.length === 0) {
      return { success: false, recordsImported: 0, errors: ['Cabeçalho inválido'] }
    }

    const rows: RntrcCacheRow[] = []
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCsvLine(lines[i], headers)
        const mapped = mapRowToCache(row)
        if (mapped) rows.push(mapped)
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'Erro de parse'}`)
      }
    }

    if (rows.length === 0) {
      await admin.from('antt_ingestion_runs').insert({
        source_url: sourceLabel,
        status: 'FAILED',
        records_imported: 0,
        error_message: 'Nenhum registro válido no CSV',
        metadata: { errors: errors.slice(0, 10) },
      })
      return { success: false, recordsImported: 0, errors }
    }

    const BATCH = 500
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await admin.from('rntrc_cache').upsert(batch, {
        onConflict: 'rntrc',
        ignoreDuplicates: false,
      })
      if (error) throw error
    }

    await admin.from('antt_ingestion_runs').insert({
      source_url: sourceLabel,
      status: 'SUCCESS',
      records_imported: rows.length,
      metadata: { total_lines: lines.length, errors_count: errors.length },
    })

    return { success: true, recordsImported: rows.length, errors }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin.from('antt_ingestion_runs').insert({
      source_url: sourceLabel,
      status: 'FAILED',
      records_imported: 0,
      error_message: msg,
      metadata: { errors: errors.slice(0, 10) },
    })
    return { success: false, recordsImported: 0, errors: [...errors, msg] }
  }
}
