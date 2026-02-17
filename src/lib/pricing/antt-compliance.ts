import type { PricingAnalyzeInput } from '@/lib/validations/pricing.schema'
import type { CarrierCostParameters } from '@/lib/pricing/pricing-engine'

export type ComplianceSeverity = 'error' | 'warning' | 'info'

export interface ComplianceAlert {
  severity: ComplianceSeverity
  code: string
  message: string
}

export interface ANTTReferenceSnapshot {
  source_url: string
  version_tag: string
  diesel_reference_price?: number | null
  floor_formula_params: {
    base_per_km?: number
    per_axle_km?: number
    diesel_coeff?: number
    operation_multiplier?: Record<string, number>
  }
}

export interface CarrierComplianceData {
  rntrc_status: 'UNKNOWN' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED'
  rntrc_expires_at?: string | null
  antt_registration_status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  civil_liability_insurance_valid_until?: string | null
}

export interface ComplianceResult {
  antt_floor_price: number
  is_below_antt_floor: boolean
  rntrc_status: string
  toll_compliance: 'OK' | 'WARNING' | 'NOT_APPLICABLE'
  has_blocking_errors: boolean
  alerts: ComplianceAlert[]
}

const round2 = (value: number) => Math.round(value * 100) / 100

function calculateAnttFloorPrice(params: {
  input: PricingAnalyzeInput
  reference: ANTTReferenceSnapshot
  costParams: CarrierCostParameters
  axleCount: number
}): number {
  const { input, reference, axleCount } = params
  const km = input.km_estimado
  const toll = input.pedagio_estimado ?? 0

  const basePerKm = reference.floor_formula_params.base_per_km ?? 1.4
  const perAxleKm = reference.floor_formula_params.per_axle_km ?? 0.22
  const dieselCoeff = reference.floor_formula_params.diesel_coeff ?? 0.08
  const operationCode = input.antt_operation_code ?? 'default'
  const opMultiplier = reference.floor_formula_params.operation_multiplier?.[operationCode] ?? 1

  const floor = ((basePerKm + (perAxleKm * axleCount) + dieselCoeff * km) * km + toll) * opMultiplier
  return round2(Math.max(0, floor))
}

function isDateExpired(date?: string | null): boolean {
  if (!date) return false
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return false
  return d < new Date()
}

export function validateAnttCompliance(params: {
  input: PricingAnalyzeInput
  analyzedPrice: number
  reference: ANTTReferenceSnapshot
  carrier: CarrierComplianceData
  costParams: CarrierCostParameters
  axleCount: number
}): ComplianceResult {
  const { input, analyzedPrice, reference, carrier, costParams, axleCount } = params

  const alerts: ComplianceAlert[] = []
  const floorPrice = calculateAnttFloorPrice({
    input,
    reference,
    costParams,
    axleCount,
  })

  const belowFloor = analyzedPrice < floorPrice
  if (belowFloor) {
    alerts.push({
      severity: 'error',
      code: 'ANTT_FLOOR_VIOLATION',
      message: `Preço informado abaixo do piso ANTT estimado (R$ ${floorPrice.toFixed(2)}).`,
    })
  }

  if (carrier.rntrc_status !== 'ACTIVE') {
    alerts.push({
      severity: 'error',
      code: 'RNTRC_INVALID',
      message: `RNTRC não está ativo (status: ${carrier.rntrc_status}).`,
    })
  }

  if (isDateExpired(carrier.rntrc_expires_at)) {
    alerts.push({
      severity: 'error',
      code: 'RNTRC_EXPIRED',
      message: 'RNTRC expirado. Atualize seu cadastro para operar sem risco regulatório.',
    })
  }

  if (carrier.antt_registration_status !== 'ACTIVE') {
    alerts.push({
      severity: 'error',
      code: 'ANTT_REGISTRATION_INACTIVE',
      message: `Cadastro ANTT irregular (status: ${carrier.antt_registration_status}).`,
    })
  }

  if (isDateExpired(carrier.civil_liability_insurance_valid_until)) {
    alerts.push({
      severity: 'error',
      code: 'INSURANCE_EXPIRED',
      message: 'Seguro de responsabilidade civil vencido.',
    })
  }

  let tollCompliance: 'OK' | 'WARNING' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE'
  const tollValue = input.pedagio_estimado ?? 0
  if (tollValue > 0) {
    if (costParams.vale_pedagio_required && !input.vale_pedagio_included) {
      tollCompliance = 'WARNING'
      alerts.push({
        severity: 'error',
        code: 'VALE_PEDAGIO_REQUIRED',
        message: 'Rota com pedágio exige vale-pedágio informado na regra.',
      })
    } else {
      tollCompliance = 'OK'
    }
  }

  const hasBlockingErrors = alerts.some((alert) => alert.severity === 'error')

  return {
    antt_floor_price: floorPrice,
    is_below_antt_floor: belowFloor,
    rntrc_status: carrier.rntrc_status,
    toll_compliance: tollCompliance,
    has_blocking_errors: hasBlockingErrors,
    alerts,
  }
}
