import type { PricingAnalyzeInput } from '@/lib/validations/pricing.schema'

export type MarginClassification = 'LOSS' | 'CRITICAL' | 'OK' | 'GREAT'

export interface CarrierCostParameters {
  diesel_price: number
  avg_consumption_km_l: number
  variable_cost_per_km: number
  fixed_monthly_cost: number
  estimated_monthly_km: number
  waiting_cost_per_hour: number
  admin_fee_percent: number
  pickup_delivery_fixed_fee: number
  empty_return_factor: number
  vale_pedagio_required: boolean
}

export interface CostBreakdown {
  fuel: number
  variable: number
  fixed_alloc: number
  tolls: number
  time_cost: number
  fees: number
  empty_return: number
}

export interface CostEstimateResult {
  total_cost: number
  breakdown: CostBreakdown
}

export interface ProfitResult {
  profit_value: number
  margin_percent: number
}

const round2 = (value: number) => Math.round(value * 100) / 100

export function estimateTotalCost(
  input: PricingAnalyzeInput,
  params: CarrierCostParameters
): CostEstimateResult {
  const km = input.km_estimado
  const price = input.price_input
  const hours = input.horas_estimadas ?? 0
  const toll = input.pedagio_estimado ?? 0

  const fuel = (km / params.avg_consumption_km_l) * params.diesel_price
  const variable = km * params.variable_cost_per_km
  const fixedAlloc = (params.fixed_monthly_cost / params.estimated_monthly_km) * km
  const timeCost = hours * params.waiting_cost_per_hour
  const fees = (price * (params.admin_fee_percent / 100)) + params.pickup_delivery_fixed_fee

  const fuelPerKm = params.diesel_price / params.avg_consumption_km_l
  const emptyReturn = km * params.empty_return_factor * (fuelPerKm + params.variable_cost_per_km)

  const breakdown: CostBreakdown = {
    fuel: round2(fuel),
    variable: round2(variable),
    fixed_alloc: round2(fixedAlloc),
    tolls: round2(toll),
    time_cost: round2(timeCost),
    fees: round2(fees),
    empty_return: round2(emptyReturn),
  }

  const total =
    breakdown.fuel +
    breakdown.variable +
    breakdown.fixed_alloc +
    breakdown.tolls +
    breakdown.time_cost +
    breakdown.fees +
    breakdown.empty_return

  return {
    total_cost: round2(total),
    breakdown,
  }
}

export function calculateProfit(price: number, totalCost: number): ProfitResult {
  const profit = price - totalCost
  const margin = price > 0 ? (profit / price) * 100 : -100

  return {
    profit_value: round2(profit),
    margin_percent: round2(margin),
  }
}

export function classifyMargin(marginPercent: number): MarginClassification {
  if (marginPercent < 0) return 'LOSS'
  if (marginPercent < 8) return 'CRITICAL'
  if (marginPercent <= 15) return 'OK'
  return 'GREAT'
}

export interface SuggestionInput {
  margin_percent: number
  total_cost: number
  current_price: number
  antt_floor_price?: number
}

export function buildDeterministicSuggestions(input: SuggestionInput): string[] {
  const suggestions: string[] = []

  if (input.margin_percent < 0) {
    suggestions.push('Margem negativa detectada. Reavalie custo fixo alocado e preço final.')
  } else if (input.margin_percent < 8) {
    suggestions.push('Margem crítica. Considere ajustar preço para atingir pelo menos 8%.')
  }

  const minPriceFor8 = input.total_cost / 0.92
  if (minPriceFor8 > input.current_price) {
    suggestions.push(`Preço mínimo estimado para margem 8%: R$ ${round2(minPriceFor8).toFixed(2)}.`)
  }

  if (input.antt_floor_price && input.current_price < input.antt_floor_price) {
    suggestions.push(`Preço abaixo do piso ANTT. Preço mínimo regulatório estimado: R$ ${round2(input.antt_floor_price).toFixed(2)}.`)
  }

  return suggestions
}
