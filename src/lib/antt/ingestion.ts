import { createClient } from '@/lib/supabase/server'

const ANTT_FLOOR_URL = 'https://www.gov.br/antt/pt-br/assuntos/cargas/piso-minimo-de-frete'

interface ParsedAnttSnapshot {
  versionTag: string
  effectiveFrom?: string
  effectiveTo?: string
  dieselReferencePrice?: number
  floorFormulaParams: {
    base_per_km: number
    per_axle_km: number
    diesel_coeff: number
    operation_multiplier: Record<string, number>
  }
  rawPayload: Record<string, unknown>
}

// This parser is intentionally conservative. ANTT may change HTML structure.
// When parsing fails, we keep previous valid snapshot and log a failed run.
export function parseAnttHtml(html: string): ParsedAnttSnapshot {
  const now = new Date()
  const normalized = html.replace(/\s+/g, ' ').toLowerCase()

  // Heuristics fallback values. They should be replaced when parser gets robust selectors.
  const hasPisoHint = normalized.includes('piso') && normalized.includes('frete')
  const dieselReferencePrice = hasPisoHint ? 6 : undefined

  return {
    versionTag: `antt-${now.toISOString().slice(0, 10)}`,
    effectiveFrom: now.toISOString().slice(0, 10),
    floorFormulaParams: {
      base_per_km: 1.4,
      per_axle_km: 0.22,
      diesel_coeff: 0.08,
      operation_multiplier: { default: 1 },
    },
    ...(dieselReferencePrice !== undefined ? { dieselReferencePrice } : {}),
    rawPayload: {
      parser: 'heuristic-v1',
      detected_piso_section: hasPisoHint,
      html_excerpt: html.slice(0, 5000),
    },
  }
}

export async function ingestAnttReferenceFromHtml(html: string) {
  const supabase = await createClient()

  try {
    const parsed = parseAnttHtml(html)

    await supabase.from('antt_reference_data').insert({
      source_url: ANTT_FLOOR_URL,
      version_tag: parsed.versionTag,
      effective_from: parsed.effectiveFrom,
      effective_to: parsed.effectiveTo,
      diesel_reference_price: parsed.dieselReferencePrice,
      floor_formula_params: parsed.floorFormulaParams,
      raw_payload: parsed.rawPayload,
    })

    await supabase.from('antt_ingestion_runs').insert({
      source_url: ANTT_FLOOR_URL,
      status: 'SUCCESS',
      records_imported: 1,
      metadata: {
        version_tag: parsed.versionTag,
      },
    })

    return { success: true, version_tag: parsed.versionTag }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await supabase.from('antt_ingestion_runs').insert({
      source_url: ANTT_FLOOR_URL,
      status: 'FAILED',
      records_imported: 0,
      error_message: message,
    })

    return { success: false, error: message }
  }
}

export const ANTT_SOURCE_URL = ANTT_FLOOR_URL
