import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/app/api/rate-limit'
import { cepToUf, ufToRegion } from '@/lib/cep-to-uf'

type QuoteRequestBody = {
  originCep: string
  destinationCep: string
  taxableWeight: number
  invoiceValue: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

/** Fator de cubagem padrão NTC & Logística para modal rodoviário */
const CUBAGEM_FACTOR = 300

/**
 * Retorna o peso taxável = MAX(peso real, peso cubado)
 * Peso cubado = (C × A × L em metros) × 300
 * Se dimensões não informadas, retorna peso real
 */
function calcTaxableWeight(realWeight: number, lengthCm?: number, widthCm?: number, heightCm?: number): number {
  if (lengthCm && widthCm && heightCm && lengthCm > 0 && widthCm > 0 && heightCm > 0) {
    const cubicMeters = (lengthCm / 100) * (widthCm / 100) * (heightCm / 100)
    const cubedWeight = cubicMeters * CUBAGEM_FACTOR
    return Math.max(realWeight, cubedWeight)
  }
  return realWeight
}

type FreightRouteRow = {
  id: string
  carrier_id: string
  origin_zip: string
  dest_zip: string
  min_price: number | null
  price_per_kg: number | null
  deadline_days: number | null
  rate_card: Record<string, unknown> | null
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/r\$/gi, '')
      .replace(/\s+/g, '')
      .replace(/\./g, '')
      .replace(',', '.')

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function calculateBaseByWeight(weight: number, route: FreightRouteRow) {
  const card = route.rate_card ?? {}

  const weight0to30   = toNumber(card.weight_0_30,    route.min_price ?? 0)
  const weight31to50  = toNumber(card.weight_31_50,   0)
  const weight51to70  = toNumber(card.weight_51_70,   0)
  const weight71to100 = toNumber(card.weight_71_100,  0)
  const above101PerKg = toNumber(card.above_101_per_kg, route.price_per_kg ?? 0)

  if (weight <= 30)  return weight0to30
  if (weight <= 50)  return weight31to50  || weight0to30
  if (weight <= 70)  return weight51to70  || weight31to50  || weight0to30
  if (weight <= 100) return weight71to100 || weight51to70  || weight31to50 || weight0to30

  // Acima de 100kg: base da faixa 71-100 + excedente × preço/kg
  // Nunca multiplica todo o peso — só o excedente acima de 100kg
  const base100 = weight71to100 || weight51to70 || weight31to50 || weight0to30
  const excedente = weight - 100
  return Math.max(base100 + excedente * above101PerKg, route.min_price ?? 0)
}

function calculateFreightTotal(route: FreightRouteRow, taxableWeight: number, invoiceValue: number) {
  const card = route.rate_card ?? {}

  const basePrice = calculateBaseByWeight(taxableWeight, route)
  const dispatchFee = toNumber(card.dispatch_fee)
  const grisPercent = toNumber(card.gris_percent)
  const insurancePercent = toNumber(card.insurance_percent)
  const tollPer100kg = toNumber(card.toll_per_100kg)
  const icmsPercent = toNumber(card.icms_percent)

  const grisValue = invoiceValue * (grisPercent / 100)
  const insuranceValue = invoiceValue * (insurancePercent / 100)
  const tollValue = tollPer100kg > 0 ? Math.ceil(Math.max(taxableWeight, 1) / 100) * tollPer100kg : 0

  const subtotal = basePrice + dispatchFee + grisValue + insuranceValue + tollValue
  // ICMS por dentro (padrão NTC): total = subtotal ÷ (1 - ICMS%)
  // Se ICMS = 0, não altera o valor
  const icmsFactor = icmsPercent > 0 ? (1 - icmsPercent / 100) : 1
  const totalWithIcms = icmsFactor > 0 ? subtotal / icmsFactor : subtotal
  const total = Math.max(totalWithIcms, route.min_price ?? 0)

  return Number(total.toFixed(2))
}

export async function POST(request: Request) {
  const limited = rateLimit(request as any, 30)
  if (limited) return limited

  try {
    const body = (await request.json()) as QuoteRequestBody

    const originDigits = digitsOnly(body.originCep || '')
    const destinationDigits = digitsOnly(body.destinationCep || '')
    const realWeight = Number(body.taxableWeight || 0)
    const invoiceValue = Number(body.invoiceValue || 0)

    // Calcula peso taxável = MAX(peso real, peso cubado)
    const taxableWeight = calcTaxableWeight(
      realWeight,
      body.lengthCm,
      body.widthCm,
      body.heightCm,
    )

    if (originDigits.length !== 8 || destinationDigits.length !== 8) {
      return NextResponse.json({ success: false, error: 'CEP de origem e destino devem ter 8 dígitos.' }, { status: 400 })
    }

    if (!Number.isFinite(taxableWeight) || taxableWeight <= 0) {
      return NextResponse.json({ success: false, error: 'Peso taxável inválido.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Busca primária: RPC match_freight_routes (range lookup definitivo) ────
    // A função SQL verifica: origin_zip <= CEP <= origin_zip_end
    // Cobre CEPs exatos, faixas de CEP e UFs completos corretamente.
    const { data: rpcRoutes, error: rpcError } = await admin
      .rpc('match_freight_routes', {
        p_origin_zip: originDigits,
        p_dest_zip: destinationDigits,
      })

    let routes: typeof rpcRoutes = rpcRoutes ?? []

    if (rpcError) {
      console.error('Erro RPC match_freight_routes:', rpcError)
    }

    // ── Fallback 1: busca por UF (rotas cadastradas só com origin_uf/dest_uf) ─
    if (!routes || routes.length === 0) {
      const originUf = cepToUf(originDigits)
      const destUf = cepToUf(destinationDigits)
      if (originUf && destUf) {
        const { data: ufRoutes } = await admin
          .from('freight_routes')
          .select('id, carrier_id, origin_zip, dest_zip, min_price, price_per_kg, deadline_days, rate_card')
          .eq('origin_uf', originUf)
          .eq('dest_uf', destUf)
          .or('is_active.is.null,is_active.eq.true')
          .limit(50)
        routes = ufRoutes ?? []
      }
    }

    // ── Fallback 2: busca por macro-região ────────────────────────────────────
    if (!routes || routes.length === 0) {
      const originUf = cepToUf(originDigits)
      const destUf = cepToUf(destinationDigits)
      const originRegion = originUf ? ufToRegion(originUf) : null
      const destRegion = destUf ? ufToRegion(destUf) : null
      if (originRegion && destRegion) {
        const { data: regionRoutes } = await admin
          .from('freight_routes')
          .select('id, carrier_id, origin_zip, dest_zip, min_price, price_per_kg, deadline_days, rate_card')
          .eq('origin_region', originRegion)
          .eq('dest_region', destRegion)
          .or('is_active.is.null,is_active.eq.true')
          .limit(50)
        routes = regionRoutes ?? []
      }
    }

    const validRoutes = (routes ?? []) as FreightRouteRow[]

    if (validRoutes.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const carrierIds = Array.from(new Set(validRoutes.map((route) => route.carrier_id).filter(Boolean)))

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, company_id, full_name, name')
      .in('id', carrierIds)

    const companyIds = Array.from(
      new Set((profiles ?? []).map((profile) => profile.company_id).filter((value) => typeof value === 'string'))
    )

    const { data: companies } = companyIds.length
      ? await admin
          .from('companies')
          .select('id, name, nome_fantasia, razao_social, logo_url')
          .in('id', companyIds)
      : { data: [] as Array<Record<string, unknown>> }

    const companyById = new Map((companies ?? []).map((company) => [String(company.id), company]))

    const profileById = new Map((profiles ?? []).map((profile) => [String(profile.id), profile]))

    console.log('Debug - Profiles encontrados:', profiles?.length || 0)
    console.log('Debug - Companies encontradas:', companies?.length || 0)
    console.log('Debug - CarrierIds:', carrierIds)

    const localOffers = validRoutes
      .map((route) => {
        const profile = profileById.get(route.carrier_id)
        const company = profile?.company_id ? companyById.get(String(profile.company_id)) : undefined

        console.log('Debug - Processando rota:', { 
          routeId: route.id, 
          carrierId: route.carrier_id, 
          hasProfile: !!profile, 
          hasCompany: !!company,
          companyId: profile?.company_id 
        })

        const carrierName =
          String(company?.nome_fantasia || company?.razao_social || company?.name || profile?.full_name || profile?.name || 'Transportadora')

        const offer = {
          id: route.id,
          carrier: carrierName,
          carrierId: route.carrier_id ?? null,
          logoUrl: (company?.logo_url as string | null) ?? null,
          price: calculateFreightTotal(route, taxableWeight, invoiceValue),
          deadline: route.deadline_days ? `${route.deadline_days} dias úteis` : 'Prazo sob consulta',
          deadlineDays: route.deadline_days ?? null,
          type: 'Tabela Importada',
        }

        console.log('Debug - Offer criada:', offer)
        return offer
      })

    // Busca SSW em paralelo (não bloqueia se falhar)
    let sswOffers: Array<{ id: string; carrier: string; logoUrl: string | null; price: number; deadline: string; type: string }> = []
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const sswRes = await fetch(`${baseUrl}/api/quotes/ssw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepOrigem: originDigits,
          cepDestino: destinationDigits,
          peso: taxableWeight,
          valor: invoiceValue,
          volumes: 1,
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (sswRes.ok) {
        const sswData = await sswRes.json()
        sswOffers = (sswData.data ?? []).map((o: { id: string; carrier: string; logoUrl: string | null; price: number; deadline: string }) => ({
          ...o,
          type: 'SSW',
        }))
        console.log('Debug - SSW offers:', sswOffers.length)
      }
    } catch (sswErr) {
      console.warn('SSW indisponível ou timeout:', sswErr)
    }

    const allOffers = [...localOffers, ...sswOffers].sort((a, b) => a.price - b.price)

    console.log('Debug - Final offers:', allOffers.length)

    return NextResponse.json({ success: true, data: allOffers })
  } catch (error) {
    console.error('Erro inesperado ao calcular cotação:', error)
    return NextResponse.json({ success: false, error: 'Erro inesperado ao calcular cotação.' }, { status: 500 })
  }
}
