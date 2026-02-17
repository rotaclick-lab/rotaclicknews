import { describe, expect, it } from 'vitest'
import {
  estimateTotalCost,
  calculateProfit,
  classifyMargin,
  type CarrierCostParameters,
} from '@/lib/pricing/pricing-engine'
import { validateAnttCompliance } from '@/lib/pricing/antt-compliance'
import type { PricingAnalyzeInput } from '@/lib/validations/pricing.schema'

const baseParams: CarrierCostParameters = {
  diesel_price: 6,
  avg_consumption_km_l: 3,
  variable_cost_per_km: 1.2,
  fixed_monthly_cost: 12000,
  estimated_monthly_km: 10000,
  waiting_cost_per_hour: 45,
  admin_fee_percent: 2,
  pickup_delivery_fixed_fee: 25,
  empty_return_factor: 0.15,
  vale_pedagio_required: true,
}

const baseInput: PricingAnalyzeInput = {
  carrier_id: '11111111-1111-1111-1111-111111111111',
  vehicle_type_id: null,
  origem: { cep: '01000-000' },
  destino: { cep: '20000-000' },
  km_estimado: 500,
  horas_estimadas: 6,
  pedagio_estimado: 120,
  modelo_de_preco: 'CEP_RANGE',
  price_input: 3200,
  vale_pedagio_included: true,
}

describe('pricing engine', () => {
  it('calculates profit scenario', () => {
    const cost = estimateTotalCost(baseInput, baseParams)
    const profit = calculateProfit(baseInput.price_input, cost.total_cost)

    expect(cost.total_cost).toBeGreaterThan(0)
    expect(profit.profit_value).toBeGreaterThan(0)
    expect(classifyMargin(profit.margin_percent)).toMatch(/CRITICAL|OK|GREAT/)
  })

  it('calculates loss scenario', () => {
    const input = { ...baseInput, price_input: 500 }
    const cost = estimateTotalCost(input, baseParams)
    const profit = calculateProfit(input.price_input, cost.total_cost)

    expect(profit.profit_value).toBeLessThan(0)
    expect(classifyMargin(profit.margin_percent)).toBe('LOSS')
  })

  it('includes toll in breakdown', () => {
    const cost = estimateTotalCost({ ...baseInput, pedagio_estimado: 300 }, baseParams)
    expect(cost.breakdown.tolls).toBe(300)
  })

  it('includes time cost in breakdown', () => {
    const cost = estimateTotalCost({ ...baseInput, horas_estimadas: 10 }, baseParams)
    expect(cost.breakdown.time_cost).toBe(450)
  })

  it('includes empty return cost in breakdown', () => {
    const cost = estimateTotalCost(baseInput, baseParams)
    expect(cost.breakdown.empty_return).toBeGreaterThan(0)
  })

  it('includes fees in breakdown', () => {
    const cost = estimateTotalCost(baseInput, baseParams)
    expect(cost.breakdown.fees).toBeGreaterThan(0)
  })
})

describe('antt compliance', () => {
  it('blocks when price is below ANTT floor', () => {
    const compliance = validateAnttCompliance({
      input: { ...baseInput, price_input: 200 },
      analyzedPrice: 200,
      reference: {
        source_url: 'https://antt.gov.br',
        version_tag: 'test',
        floor_formula_params: {
          base_per_km: 1.4,
          per_axle_km: 0.22,
          diesel_coeff: 0.08,
          operation_multiplier: { default: 1 },
        },
      },
      carrier: {
        rntrc_status: 'ACTIVE',
        rntrc_expires_at: null,
        antt_registration_status: 'ACTIVE',
        civil_liability_insurance_valid_until: null,
      },
      costParams: baseParams,
      axleCount: 3,
    })

    expect(compliance.has_blocking_errors).toBe(true)
    expect(compliance.alerts.some((a) => a.code === 'ANTT_FLOOR_VIOLATION')).toBe(true)
  })

  it('blocks when vale-pedagio is required but not included', () => {
    const compliance = validateAnttCompliance({
      input: { ...baseInput, vale_pedagio_included: false },
      analyzedPrice: baseInput.price_input,
      reference: {
        source_url: 'https://antt.gov.br',
        version_tag: 'test',
        floor_formula_params: {
          base_per_km: 0.2,
          per_axle_km: 0.02,
          diesel_coeff: 0.01,
          operation_multiplier: { default: 1 },
        },
      },
      carrier: {
        rntrc_status: 'ACTIVE',
        rntrc_expires_at: null,
        antt_registration_status: 'ACTIVE',
        civil_liability_insurance_valid_until: null,
      },
      costParams: baseParams,
      axleCount: 2,
    })

    expect(compliance.alerts.some((a) => a.code === 'VALE_PEDAGIO_REQUIRED')).toBe(true)
  })
})
