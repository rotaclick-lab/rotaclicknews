'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ===== REGISTRAR COTAÇÃO =====
export async function registerQuote(data: {
  originZip: string
  destZip: string
  taxableWeight: number
  invoiceValue: number
  resultsCount: number
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()
    const { data: quote } = await admin.from('quotes').insert({
      user_id: user?.id ?? null,
      origin_zip: data.originZip.replace(/\D/g, ''),
      dest_zip: data.destZip.replace(/\D/g, ''),
      taxable_weight: data.taxableWeight,
      invoice_value: data.invoiceValue,
      results_count: data.resultsCount,
    }).select().single()
    return { success: true, quoteId: quote?.id ?? null }
  } catch { return { success: false, quoteId: null } }
}

// ===== REGISTRAR FRETE PAGO (chamado pelo webhook) =====
export async function upsertFreightFromCheckout(data: {
  sessionId: string
  offerId: string
  userId: string
  carrierName: string
  price: number
  paymentStatus: 'paid' | 'failed' | 'expired'
  paymentIntentId?: string | undefined
}) {
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('freights')
      .select('id')
      .eq('stripe_session_id', data.sessionId)
      .maybeSingle()

    if (existing?.id) {
      await admin.from('freights').update({
        payment_status: data.paymentStatus,
        stripe_payment_intent_id: data.paymentIntentId ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      return { success: true, freightId: existing.id }
    }

    const { data: freight, error } = await admin.from('freights').insert({
      user_id: data.userId,
      stripe_session_id: data.sessionId,
      stripe_payment_intent_id: data.paymentIntentId ?? null,
      carrier_name: data.carrierName,
      price: data.price,
      payment_status: data.paymentStatus,
      route_id: data.offerId,
      status: data.paymentStatus === 'paid' ? 'pending' : 'cancelled',
    }).select().single()

    if (error) return { success: false, freightId: null }

    // Marcar cotação como convertida
    await admin.from('quotes')
      .update({ converted_to_freight: true, freight_id: freight.id })
      .eq('user_id', data.userId)
      .eq('converted_to_freight', false)
      .order('created_at', { ascending: false })
      .limit(1)

    await admin.from('audit_logs').insert({
      user_id: data.userId,
      action: 'PAYMENT',
      resource_type: 'freights',
      resource_id: freight.id,
      description: `Frete pago: ${data.carrierName} — R$ ${data.price.toFixed(2)}`,
      metadata: { session_id: data.sessionId, payment_status: data.paymentStatus },
    })

    return { success: true, freightId: freight.id }
  } catch (e) {
    console.error('upsertFreightFromCheckout error:', e)
    return { success: false, freightId: null }
  }
}

// ===== LISTAR FRETES DO USUÁRIO (cliente) =====
export async function listMyFreights(params?: { page?: number; perPage?: number }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado', data: null }

    const page = params?.page ?? 1
    const perPage = params?.perPage ?? 20
    const admin = createAdminClient()

    const { data, count, error } = await admin
      .from('freights')
      .select('id, status, payment_status, carrier_name, price, origin_zip, dest_zip, deadline_days, created_at, stripe_session_id', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (error) return { success: false, error: error.message, data: null }
    return { success: true, data: { freights: data ?? [], total: count ?? 0 } }
  } catch (e) {
    return { success: false, error: String(e), data: null }
  }
}

// ===== LISTAR COTAÇÕES RECEBIDAS (transportadora) =====
export async function listCarrierQuotes(params?: { page?: number; perPage?: number; status?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado', data: null }

    const admin = createAdminClient()
    const page = params?.page ?? 1
    const perPage = params?.perPage ?? 20

    // Buscar rotas desta transportadora
    const { data: routes } = await admin
      .from('freight_routes')
      .select('id')
      .eq('carrier_id', user.id)

    const routeIds = (routes ?? []).map(r => r.id)

    // Fretes que usaram rotas desta transportadora
    let query = admin
      .from('freights')
      .select('id, status, payment_status, carrier_name, price, origin_zip, dest_zip, deadline_days, created_at, user_id, route_id', { count: 'exact' })
      .in('route_id', routeIds.length ? routeIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false })

    if (params?.status) query = query.eq('payment_status', params.status)
    query = query.range((page - 1) * perPage, page * perPage - 1)

    const { data, count, error } = await query
    if (error) return { success: false, error: error.message, data: null }

    // Enriquecer com dados do usuário
    const userIds = [...new Set((data ?? []).map(f => f.user_id).filter(Boolean))]
    const { data: profiles } = userIds.length
      ? await admin.from('profiles').select('id, name, full_name, email').in('id', userIds)
      : { data: [] }
    const profileById = new Map((profiles ?? []).map(p => [p.id, p]))

    const enriched = (data ?? []).map(f => ({
      ...f,
      client_name: profileById.get(f.user_id)?.name || profileById.get(f.user_id)?.full_name || profileById.get(f.user_id)?.email || 'Cliente',
    }))

    return { success: true, data: { freights: enriched, total: count ?? 0 } }
  } catch (e) {
    return { success: false, error: String(e), data: null }
  }
}

// ===== STATS DO DASHBOARD DA TRANSPORTADORA =====
export async function getCarrierDashboardStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado', data: null }

    const admin = createAdminClient()

    // Rotas desta transportadora
    const { data: routes, count: routesCount } = await admin
      .from('freight_routes')
      .select('id', { count: 'exact' })
      .eq('carrier_id', user.id)

    const routeIds = (routes ?? []).map(r => r.id)

    // Fretes pagos desta transportadora
    const { data: freights, count: freightsCount } = await admin
      .from('freights')
      .select('id, price, payment_status, status, created_at', { count: 'exact' })
      .in('route_id', routeIds.length ? routeIds : ['00000000-0000-0000-0000-000000000000'])

    const paidFreights = (freights ?? []).filter(f => f.payment_status === 'paid')
    const totalRevenue = paidFreights.reduce((sum, f) => sum + (Number(f.price) || 0), 0)

    // Cotações recebidas (quotes que matcharam rotas desta transportadora)
    const { count: quotesCount } = await admin
      .from('quotes')
      .select('id', { count: 'exact' })
      .eq('selected_carrier_id', user.id)

    // Faturamento por mês (últimos 6 meses)
    const now = new Date()
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const monthStart = d.toISOString().slice(0, 7)
      const monthFreights = paidFreights.filter(f => f.created_at?.startsWith(monthStart))
      return {
        mes: label,
        valor: monthFreights.reduce((sum, f) => sum + (Number(f.price) || 0), 0),
        fretes: monthFreights.length,
      }
    })

    // Status dos fretes
    const statusMap: Record<string, number> = {}
    ;(freights ?? []).forEach(f => {
      const key = f.payment_status === 'paid' ? (f.status || 'pending') : f.payment_status
      statusMap[key] = (statusMap[key] || 0) + 1
    })

    return {
      success: true,
      data: {
        totalRoutes: routesCount ?? 0,
        totalFreights: freightsCount ?? 0,
        paidFreights: paidFreights.length,
        totalRevenue,
        quotesReceived: quotesCount ?? 0,
        conversionRate: (freightsCount ?? 0) > 0
          ? ((paidFreights.length / (freightsCount ?? 1)) * 100).toFixed(1)
          : '0',
        monthlyData,
        statusBreakdown: Object.entries(statusMap).map(([name, value]) => ({ name, value })),
      },
    }
  } catch (e) {
    return { success: false, error: String(e), data: null }
  }
}

// ===== BUSCAR FRETE POR SESSION_ID (página de sucesso) =====
export async function getFreightBySessionId(sessionId: string) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('freights')
      .select('id, status, payment_status, carrier_name, price, origin_zip, dest_zip, deadline_days, created_at, stripe_session_id, user_id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (error) return { success: false, data: null }
    return { success: true, data }
  } catch {
    return { success: false, data: null }
  }
}

// ===== ATUALIZAR STATUS DO FRETE =====
export async function updateFreightStatus(freightId: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autenticado' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('freights')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', freightId)

    if (error) return { success: false, error: error.message }

    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'UPDATE',
      resource_type: 'freights',
      resource_id: freightId,
      description: `Status do frete atualizado para: ${status}`,
    })

    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
