import { createAdminClient } from '@/lib/supabase/admin'

const CKAN_API_BASE = 'https://dados.antt.gov.br/api/3/action'

/** Busca URL do CSV RNTRC na API CKAN da ANTT */
async function fetchCsvUrlFromCkan(): Promise<string | null> {
  // Tentar package_search por rntrc/transportadores
  const searchRes = await fetch(
    `${CKAN_API_BASE}/package_search?q=rntrc+transportadores&rows=10`
  )
  const searchJson = await searchRes.json()

  if (!searchJson.success || !searchJson.result?.results?.length) {
    // Fallback: datasets conhecidos (rntrc-veiculos = RNTRC Dados de Veículos)
    const knownIds = ['rntrc-veiculos', 'rntrc-transportadores', 'transporte-rodoviario-de-cargas']
    for (const id of knownIds) {
      const showRes = await fetch(`${CKAN_API_BASE}/package_show?id=${id}`)
      const showJson = await showRes.json()
      if (showJson.success && showJson.result?.resources?.length) {
        const csv = showJson.result.resources.find(
          (r: { format?: string }) => (r.format || '').toUpperCase() === 'CSV'
        )
        if (csv?.url) return csv.url
      }
    }
    return null
  }

  for (const pkg of searchJson.result.results) {
    const resources = pkg.resources || []
    const csv = resources.find(
      (r: { format?: string }) => (r.format || '').toUpperCase() === 'CSV'
    )
    if (csv?.url) return csv.url
  }

  return null
}

/** Baixa CSV da ANTT via API CKAN e faz ingestão */
export async function ingestRntrcFromCkanApi(): Promise<{
  success: boolean
  recordsImported: number
  errors: string[]
  source?: string
}> {
  try {
    const csvUrl = await fetchCsvUrlFromCkan()
    if (!csvUrl) {
      return {
        success: false,
        recordsImported: 0,
        errors: ['Nenhum recurso CSV encontrado na API CKAN da ANTT'],
      }
    }

    const res = await fetch(csvUrl)
    if (!res.ok) {
      return {
        success: false,
        recordsImported: 0,
        errors: [`Falha ao baixar CSV: ${res.status} ${res.statusText}`],
      }
    }

    const csvText = await res.text()
    return ingestRntrcFromCsv(csvText, `ckan_api_${new Date().toISOString().slice(0, 10)}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, recordsImported: 0, errors: [msg] }
  }
}

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
