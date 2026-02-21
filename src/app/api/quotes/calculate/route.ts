import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/app/api/rate-limit'

type QuoteRequestBody = {
  originCep: string
  destinationCep: string
  taxableWeight: number
  invoiceValue: number
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

function maskCep(value: string) {
  const digits = digitsOnly(value)
  if (digits.length !== 8) return value
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
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

  const weight0to30 = toNumber(card.weight_0_30, route.min_price ?? 0)
  const weight31to50 = toNumber(card.weight_31_50, 0)
  const weight51to70 = toNumber(card.weight_51_70, 0)
  const weight71to100 = toNumber(card.weight_71_100, 0)
  const above101PerKg = toNumber(card.above_101_per_kg, route.price_per_kg ?? 0)

  if (weight <= 30) return weight0to30
  if (weight <= 50) return weight31to50 || weight0to30
  if (weight <= 70) return weight51to70 || weight31to50 || weight0to30
  if (weight <= 100) return weight71to100 || weight51to70 || weight31to50 || weight0to30

  return Math.max(weight * above101PerKg, route.min_price ?? 0)
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
  const totalWithIcms = subtotal * (1 + icmsPercent / 100)
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
    const taxableWeight = Number(body.taxableWeight || 0)
    const invoiceValue = Number(body.invoiceValue || 0)

    if (originDigits.length !== 8 || destinationDigits.length !== 8) {
      return NextResponse.json({ success: false, error: 'CEP de origem e destino devem ter 8 dígitos.' }, { status: 400 })
    }

    if (!Number.isFinite(taxableWeight) || taxableWeight <= 0) {
      return NextResponse.json({ success: false, error: 'Peso taxável inválido.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const originVariants = Array.from(new Set([originDigits, maskCep(originDigits)]))
    const destinationVariants = Array.from(new Set([destinationDigits, maskCep(destinationDigits)]))

    // Busca exata primeiro
    let { data: routes, error: routesError } = await admin
      .from('freight_routes')
      .select('id, carrier_id, origin_zip, dest_zip, min_price, price_per_kg, deadline_days, rate_card')
      .in('origin_zip', originVariants)
      .in('dest_zip', destinationVariants)
      .or('is_active.is.null,is_active.eq.true')

    if (routesError) {
      console.error('Erro ao consultar freight_routes:', routesError)
      return NextResponse.json({ success: false, error: 'Erro ao consultar tabela de frete.' }, { status: 500 })
    }

    // Fallback: busca por prefixo de 5 dígitos se não encontrou resultado exato
    if (!routes || routes.length === 0) {
      const originPrefix = originDigits.slice(0, 5)
      const destPrefix = destinationDigits.slice(0, 5)
      const { data: prefixRoutes } = await admin
        .from('freight_routes')
        .select('id, carrier_id, origin_zip, dest_zip, min_price, price_per_kg, deadline_days, rate_card')
        .like('origin_zip', `${originPrefix}%`)
        .like('dest_zip', `${destPrefix}%`)
        .or('is_active.is.null,is_active.eq.true')
        .limit(50)
      routes = prefixRoutes ?? []
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

    const offers = validRoutes
      .map((route) => {
        const profile = profileById.get(route.carrier_id)
        const company = profile?.company_id ? companyById.get(String(profile.company_id)) : undefined

        const carrierName =
          String(company?.nome_fantasia || company?.razao_social || company?.name || profile?.full_name || profile?.name || 'Transportadora')

        return {
          id: route.id,
          carrier: carrierName,
          logoUrl: company?.logo_url ?? null,
          price: calculateFreightTotal(route, taxableWeight, invoiceValue),
          deadline: route.deadline_days ? `${route.deadline_days} dias úteis` : 'Prazo sob consulta',
          type: 'Tabela Importada',
        }
      })
      .sort((a, b) => a.price - b.price)

    return NextResponse.json({ success: true, data: offers })
  } catch (error) {
    console.error('Erro inesperado ao calcular cotação:', error)
    return NextResponse.json({ success: false, error: 'Erro inesperado ao calcular cotação.' }, { status: 500 })
  }
}
