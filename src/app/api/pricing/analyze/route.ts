import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pricingAnalyzeInputSchema } from '@/lib/validations/pricing.schema'
import {
  estimateTotalCost,
  calculateProfit,
  classifyMargin,
  buildDeterministicSuggestions,
  type CarrierCostParameters,
} from '@/lib/pricing/pricing-engine'
import {
  validateAnttCompliance,
  type ANTTReferenceSnapshot,
  type CarrierComplianceData,
} from '@/lib/pricing/antt-compliance'

const DEFAULT_COST_PARAMS: CarrierCostParameters = {
  diesel_price: 6,
  avg_consumption_km_l: 3,
  variable_cost_per_km: 1.2,
  fixed_monthly_cost: 12000,
  estimated_monthly_km: 10000,
  waiting_cost_per_hour: 45,
  admin_fee_percent: 0,
  pickup_delivery_fixed_fee: 0,
  empty_return_factor: 0,
  vale_pedagio_required: true,
}

const DEFAULT_ANTT_REFERENCE: ANTTReferenceSnapshot = {
  source_url: 'https://www.gov.br/antt/pt-br/assuntos/cargas/piso-minimo-de-frete',
  version_tag: 'fallback-default',
  floor_formula_params: {
    base_per_km: 1.4,
    per_axle_km: 0.22,
    diesel_coeff: 0.08,
    operation_multiplier: {
      default: 1,
    },
  },
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = pricingAnalyzeInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message || 'Payload inválido',
        },
        { status: 400 }
      )
    }

    const input = parsed.data

    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('id, user_id, rntrc_status, rntrc_expires_at, antt_registration_status, civil_liability_insurance_valid_until')
      .eq('id', input.carrier_id)
      .eq('user_id', user.id)
      .single()

    if (carrierError || !carrier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transportadora não encontrada para o usuário autenticado',
        },
        { status: 404 }
      )
    }

    const { data: costParamRows } = await supabase
      .from('carrier_cost_parameters')
      .select('*')
      .eq('carrier_id', carrier.id)
      .eq('active', true)
      .order('updated_at', { ascending: false })

    const costParamsRecord = input.vehicle_type_id
      ? costParamRows?.find((row) => row.vehicle_type_id === input.vehicle_type_id)
      : costParamRows?.[0]

    const costParams: CarrierCostParameters = costParamsRecord
      ? {
          diesel_price: Number(costParamsRecord.diesel_price),
          avg_consumption_km_l: Number(costParamsRecord.avg_consumption_km_l),
          variable_cost_per_km: Number(costParamsRecord.variable_cost_per_km),
          fixed_monthly_cost: Number(costParamsRecord.fixed_monthly_cost),
          estimated_monthly_km: Number(costParamsRecord.estimated_monthly_km),
          waiting_cost_per_hour: Number(costParamsRecord.waiting_cost_per_hour),
          admin_fee_percent: Number(costParamsRecord.admin_fee_percent),
          pickup_delivery_fixed_fee: Number(costParamsRecord.pickup_delivery_fixed_fee),
          empty_return_factor: Number(costParamsRecord.empty_return_factor),
          vale_pedagio_required: Boolean(costParamsRecord.vale_pedagio_required),
        }
      : DEFAULT_COST_PARAMS

    let axleCount = 2
    if (input.custom_axles) {
      axleCount = input.custom_axles
    } else if (input.vehicle_type_id) {
      const { data: vehicleType } = await supabase
        .from('vehicle_types')
        .select('default_axles')
        .eq('id', input.vehicle_type_id)
        .single()

      if (vehicleType?.default_axles) {
        axleCount = Number(vehicleType.default_axles)
      }
    }

    const { data: anttRefRow } = await supabase
      .from('antt_reference_data')
      .select('source_url, version_tag, diesel_reference_price, floor_formula_params')
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    const anttReference: ANTTReferenceSnapshot = anttRefRow
      ? {
          source_url: anttRefRow.source_url,
          version_tag: anttRefRow.version_tag,
          diesel_reference_price: anttRefRow.diesel_reference_price
            ? Number(anttRefRow.diesel_reference_price)
            : null,
          floor_formula_params: (anttRefRow.floor_formula_params as ANTTReferenceSnapshot['floor_formula_params']) ||
            DEFAULT_ANTT_REFERENCE.floor_formula_params,
        }
      : DEFAULT_ANTT_REFERENCE

    const carrierCompliance: CarrierComplianceData = {
      rntrc_status: carrier.rntrc_status,
      rntrc_expires_at: carrier.rntrc_expires_at,
      antt_registration_status: carrier.antt_registration_status,
      civil_liability_insurance_valid_until: carrier.civil_liability_insurance_valid_until,
    }

    const costEstimate = estimateTotalCost(input, costParams)
    const profit = calculateProfit(input.price_input, costEstimate.total_cost)
    const classification = classifyMargin(profit.margin_percent)

    const compliance = validateAnttCompliance({
      input,
      analyzedPrice: input.price_input,
      reference: anttReference,
      carrier: carrierCompliance,
      costParams,
      axleCount,
    })

    const suggestions = buildDeterministicSuggestions({
      margin_percent: profit.margin_percent,
      total_cost: costEstimate.total_cost,
      current_price: input.price_input,
      antt_floor_price: compliance.antt_floor_price,
    })

    const responsePayload = {
      success: true,
      total_cost: costEstimate.total_cost,
      breakdown: costEstimate.breakdown,
      profit_value: profit.profit_value,
      margin_percent: profit.margin_percent,
      classification,
      compliance: {
        antt_floor_price: compliance.antt_floor_price,
        is_below_antt_floor: compliance.is_below_antt_floor,
        rntrc_status: compliance.rntrc_status,
        toll_compliance: compliance.toll_compliance,
      },
      alerts: compliance.alerts,
      blocking: compliance.has_blocking_errors,
      suggestions,
      metadata: {
        antt_source: anttReference.source_url,
        antt_version: anttReference.version_tag,
        used_default_params: !costParamsRecord,
      },
    }

    await supabase.from('pricing_analysis_logs').insert({
      carrier_id: carrier.id,
      vehicle_type_id: input.vehicle_type_id ?? null,
      pricing_model: input.modelo_de_preco,
      input_payload: input,
      cost_breakdown: costEstimate.breakdown,
      total_cost: costEstimate.total_cost,
      analyzed_price: input.price_input,
      profit_value: profit.profit_value,
      margin_percent: profit.margin_percent,
      classification,
      compliance_has_errors: compliance.has_blocking_errors,
      compliance_result: {
        compliance,
        metadata: responsePayload.metadata,
      },
    })

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Error in /pricing/analyze:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao analisar rentabilidade e conformidade',
      },
      { status: 500 }
    )
  }
}
