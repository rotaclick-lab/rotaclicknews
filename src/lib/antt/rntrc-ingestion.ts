import { createAdminClient } from '@/lib/supabase/admin'

const CKAN_API_BASE = 'https://dados.antt.gov.br/api/3/action'

/** Busca URL do CSV RNTRC mais recente na API CKAN da ANTT */
async function fetchCsvUrlFromCkan(): Promise<{ url: string; name: string } | null> {
  console.log('[RNTRC] Buscando dataset na API CKAN:', `${CKAN_API_BASE}/package_show?id=rntrc`)
  const showRes = await fetch(`${CKAN_API_BASE}/package_show?id=rntrc`, { signal: AbortSignal.timeout(30000) })
  console.log('[RNTRC] Status da resposta CKAN:', showRes.status, showRes.statusText)
  const showJson = await showRes.json()
  console.log('[RNTRC] CKAN success:', showJson.success, '| resources:', showJson.result?.resources?.length ?? 0)

  if (showJson.success && showJson.result?.resources?.length) {
    const allResources = showJson.result.resources as Array<{ format?: string; url: string; name: string; position: number }>
    console.log('[RNTRC] Recursos disponíveis:', allResources.map(r => `${r.name} (${r.format}) pos=${r.position}`))
    const csvResources = allResources
      .filter((r) => (r.format || '').toUpperCase() === 'CSV')
      .sort((a, b) => b.position - a.position)
    console.log('[RNTRC] CSVs encontrados:', csvResources.map(r => `${r.name} pos=${r.position}`))
    const first = csvResources[0]
    if (first) {
      console.log('[RNTRC] CSV selecionado:', first.name, '|', first.url)
      return { url: first.url, name: first.name }
    }
  } else {
    console.error('[RNTRC] Falha ao buscar dataset CKAN:', JSON.stringify(showJson).slice(0, 500))
  }

  return null
}

/** Inicia o download e ingestão RNTRC em background — retorna jobId imediatamente */
export async function ingestRntrcFromCkanApiAsync(): Promise<{
  jobId: string
  error?: string
}> {
  const admin = createAdminClient()

  // Cria o registro de job com status RUNNING
  const { data: jobRow, error: insertError } = await admin
    .from('antt_ingestion_runs')
    .insert({
      source_url: 'ckan_api_async_pending',
      status: 'RUNNING',
      records_imported: 0,
      metadata: { started_at: new Date().toISOString() },
    })
    .select('id')
    .single()

  if (insertError || !jobRow) {
    return { jobId: '', error: 'Erro ao criar job: ' + (insertError?.message ?? 'unknown') }
  }

  const jobId = jobRow.id as string
  console.log('[RNTRC] Job criado:', jobId)

  // Dispara o processamento em background (não awaited)
  void runIngestionJob(jobId, admin)

  return { jobId }
}

async function runIngestionJob(jobId: string, admin: ReturnType<typeof createAdminClient>) {
  try {
    const csvResource = await fetchCsvUrlFromCkan()
    if (!csvResource) {
      await admin.from('antt_ingestion_runs').update({
        status: 'FAILED',
        error_message: 'Nenhum recurso CSV encontrado na API CKAN da ANTT',
      }).eq('id', jobId)
      return
    }

    await admin.from('antt_ingestion_runs').update({
      source_url: csvResource.url,
      metadata: { started_at: new Date().toISOString(), csv_name: csvResource.name },
    }).eq('id', jobId)

    const res = await fetch(csvResource.url, { signal: AbortSignal.timeout(300000) })
    if (!res.ok) {
      await admin.from('antt_ingestion_runs').update({
        status: 'FAILED',
        error_message: `Falha ao baixar CSV: ${res.status} ${res.statusText}`,
      }).eq('id', jobId)
      return
    }

    const contentType = res.headers.get('content-type') ?? ''
    const charsetMatch = contentType.match(/charset=([\w-]+)/i)
    const charset = charsetMatch?.[1] ?? 'iso-8859-1'
    console.log('[RNTRC] Content-Type:', contentType, '| Charset:', charset)
    const buffer = await res.arrayBuffer()
    console.log('[RNTRC] Tamanho:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB')
    const csvText = new TextDecoder(charset).decode(buffer)
    console.log('[RNTRC] Primeiros 300 chars:', csvText.slice(0, 300))

    const sourceLabel = `ckan_api_${csvResource.name}_${new Date().toISOString().slice(0, 10)}`
    const result = await ingestRntrcFromCsv(csvText, sourceLabel)

    console.log('[RNTRC] Job', jobId, 'finalizado:', result.recordsImported, 'registros')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[RNTRC] Job', jobId, 'erro fatal:', msg)
    try {
      await admin.from('antt_ingestion_runs').update({
        status: 'FAILED',
        error_message: msg,
      }).eq('id', jobId)
    } catch { /* ignore */ }
  }
}

/** Baixa CSV da ANTT via API CKAN e faz ingestão */
export async function ingestRntrcFromCkanApi(): Promise<{
  success: boolean
  recordsImported: number
  errors: string[]
  source?: string
}> {
  try {
    const csvResource = await fetchCsvUrlFromCkan()
    if (!csvResource) {
      return {
        success: false,
        recordsImported: 0,
        errors: ['Nenhum recurso CSV encontrado na API CKAN da ANTT'],
      }
    }

    const res = await fetch(csvResource.url, { signal: AbortSignal.timeout(300000) })
    if (!res.ok) {
      return {
        success: false,
        recordsImported: 0,
        errors: [`Falha ao baixar CSV: ${res.status} ${res.statusText}`],
      }
    }

    // CSV da ANTT geralmente usa ISO-8859-1 (Latin-1)
    const contentType = res.headers.get('content-type') ?? ''
    const charsetMatch = contentType.match(/charset=([\w-]+)/i)
    const charset = charsetMatch?.[1] ?? 'iso-8859-1'
    console.log('[RNTRC] Content-Type:', contentType, '| Charset detectado:', charset)
    const buffer = await res.arrayBuffer()
    console.log('[RNTRC] Tamanho do arquivo:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB')
    const csvText = new TextDecoder(charset).decode(buffer)
    console.log('[RNTRC] Primeiros 300 chars do CSV:', csvText.slice(0, 300))
    return ingestRntrcFromCsv(csvText, `ckan_api_${csvResource.name}_${new Date().toISOString().slice(0, 10)}`)
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
  return row as Record<string, string>
}

function mapRowToCache(row: Record<string, string>): RntrcCacheRow | null {
  // Nomes reais das colunas do CSV da ANTT (Jan/2026):
  // numero_rntrc, nome_transportador, situacao_rntrc, cpfcnpjtransportador,
  // categoria_transportador, municipio, uf, data_primeiro_cadastro, data_situacao_rntrc
  const rntrc = (
    row['numero_rntrc'] ?? row['RNTRC'] ?? row['NU_RNTRC'] ?? row['rntrc'] ?? row['NumeroRNTRC'] ?? ''
  ).replace(/\D/g, '')
  if (!rntrc || rntrc.length < 8) return null

  const situacaoRaw =
    row['situacao_rntrc'] ?? row['SG_SITUACAO'] ?? row['SITUACAO'] ?? row['situacao'] ?? row['Situacao'] ?? 'UNKNOWN'
  return {
    rntrc,
    cpf_cnpj: (
      row['cpfcnpjtransportador'] ?? row['CPF_CNPJ'] ?? row['NU_CPF_CNPJ'] ?? row['cpf_cnpj'] ?? row['CPFCNPJ'] ?? ''
    ).replace(/\D/g, '') || null,
    razao_social: (
      row['nome_transportador'] ?? row['NO_RAZAO_SOCIAL'] ?? row['RAZAO_SOCIAL'] ?? row['razao_social'] ?? row['Nome'] ?? ''
    ).trim() || null,
    situacao: normalizeSituacao(situacaoRaw),
    categoria: (row['categoria_transportador'] ?? row['DS_CATEGORIA'] ?? row['CATEGORIA'] ?? row['categoria'] ?? '').trim() || null,
    uf: (row['uf'] ?? row['SG_UF'] ?? row['UF'] ?? '').trim() || null,
    municipio: (row['municipio'] ?? row['NO_MUNICIPIO'] ?? row['MUNICIPIO'] ?? '').trim() || null,
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

    const firstLine = lines[0] ?? ''
    const sep = firstLine.includes(';') ? ';' : ','
    const headers = firstLine
      .split(sep)
      .map((h) => h.replace(/^"|"$/g, '').trim())
      .filter(Boolean)

    if (headers.length === 0) {
      return { success: false, recordsImported: 0, errors: ['Cabeçalho inválido'] }
    }

    console.log('[RNTRC] Headers detectados:', headers)
    console.log('[RNTRC] Separador:', sep, '| Total de linhas:', lines.length)

    const rows: RntrcCacheRow[] = []
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCsvLine(lines[i] ?? '', headers)
        const mapped = mapRowToCache(row)
        if (mapped) rows.push(mapped)
      } catch (e) {
        errors.push(`Linha ${i + 1}: ${e instanceof Error ? e.message : 'Erro de parse'}`)
      }
    }

    console.log('[RNTRC] Linhas mapeadas com sucesso:', rows.length, '| Erros de parse:', errors.length)
    if (rows.length > 0) console.log('[RNTRC] Exemplo primeiro registro:', JSON.stringify(rows[0]))

    if (rows.length === 0) {
      console.error('[RNTRC] Nenhum registro válido. Erros:', errors.slice(0, 5))
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
    console.log('[RNTRC] Iniciando upsert:', rows.length, 'registros em batches de', BATCH)
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await admin.from('rntrc_cache').upsert(batch, {
        onConflict: 'rntrc',
        ignoreDuplicates: false,
      })
      if (error) {
        console.error('[RNTRC] Erro no upsert batch', i / BATCH + 1, ':', error.message, error.code, error.details)
        throw error
      }
      if (i % 5000 === 0) console.log('[RNTRC] Progresso upsert:', i + batch.length, '/', rows.length)
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
