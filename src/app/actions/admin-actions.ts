'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Não autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores.')
  }

  return { user, admin: createAdminClient() }
}

export async function listAdminUsers(params: { page?: number; perPage?: number; search?: string }) {
  const { admin } = await requireAdmin()
  const page = params.page ?? 1
  const perPage = params.perPage ?? 20

  let query = admin.from('profiles').select('id, name, full_name, email, role, company_id, created_at', { count: 'exact' })

  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`
    query = query.or(`name.ilike.${s},email.ilike.${s}`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { users: data ?? [], total: count ?? 0 } }
}

export async function updateUserRole(userId: string, role: 'transportadora' | 'cliente' | 'admin') {
  const { admin } = await requireAdmin()

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function listAdminCompanies(params: { page?: number; perPage?: number; search?: string }) {
  const { admin } = await requireAdmin()
  const page = params.page ?? 1
  const perPage = params.perPage ?? 20

  let query = admin
    .from('companies')
    .select('id, name, document, email, razao_social, nome_fantasia, rntrc, city, state, is_active, created_at', {
      count: 'exact',
    })

  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`
    query = query.or(`name.ilike.${s},document.ilike.${s},razao_social.ilike.${s},email.ilike.${s}`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { companies: data ?? [], total: count ?? 0 } }
}

export async function listAdminCarriers(params: { page?: number; perPage?: number; search?: string }) {
  const { admin } = await requireAdmin()
  const page = params.page ?? 1
  const perPage = params.perPage ?? 20

  const { data: carriers, error: carriersError } = await admin
    .from('carriers')
    .select('id, user_id, rntrc, rntrc_status, company_name, created_at')
    .order('created_at', { ascending: false })

  if (carriersError) return { success: false, error: carriersError.message }

  const userIds = [...new Set((carriers ?? []).map((c) => c.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, company_id').in('id', userIds)
    : { data: [] }

  const companyIds = [...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean))]
  const { data: companies } = companyIds.length
    ? await admin.from('companies').select('id, name, document, razao_social, nome_fantasia, rntrc').in('id', companyIds)
    : { data: [] }

  const companyById = new Map((companies ?? []).map((c) => [c.id, c]))
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const enriched = (carriers ?? []).map((c) => {
    const profile = profileById.get(c.user_id)
    const company = profile?.company_id ? companyById.get(profile.company_id) : null
    return {
      ...c,
      companyName: company?.nome_fantasia || company?.razao_social || company?.name || c.company_name,
      document: company?.document,
    }
  })

  const filtered = params.search?.trim()
    ? enriched.filter(
        (c) =>
          c.companyName?.toLowerCase().includes(params.search!.toLowerCase()) ||
          c.document?.includes(params.search!) ||
          c.rntrc?.includes(params.search!)
      )
    : enriched

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return { success: true, data: { carriers: paginated, total } }
}

export async function listRntrcIngestionRuns(limit = 20) {
  const { admin } = await requireAdmin()

  const { data, error } = await admin
    .from('antt_ingestion_runs')
    .select('created_at, status, records_imported, source_url, error_message')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}

// --- USUÁRIOS CRUD ---
export async function createAdminUser(data: {
  email: string
  password: string
  name: string
  role: 'transportadora' | 'cliente' | 'admin'
  company_id?: string | null
}) {
  const { admin } = await requireAdmin()
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.name },
  })
  if (authError || !authUser.user) return { success: false, error: authError?.message ?? 'Erro ao criar usuário' }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id,
    name: data.name,
    full_name: data.name,
    email: data.email,
    role: data.role,
    company_id: data.company_id ?? null,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { success: false, error: profileError.message }
  }
  return { success: true }
}

export async function updateAdminUser(
  userId: string,
  data: { name?: string; full_name?: string; email?: string; role?: 'transportadora' | 'cliente' | 'admin'; company_id?: string | null }
) {
  const { admin } = await requireAdmin()
  const updates: Record<string, unknown> = {}
  if (data.name != null) updates.name = data.name
  if (data.full_name != null) updates.full_name = data.full_name
  if (data.role != null) updates.role = data.role
  if (data.company_id !== undefined) updates.company_id = data.company_id
  updates.updated_at = new Date().toISOString()

  const { error } = await admin.from('profiles').update(updates).eq('id', userId)
  if (error) return { success: false, error: error.message }
  if (data.email) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, { email: data.email })
    if (authError) return { success: false, error: authError.message }
  }
  return { success: true }
}

export async function deleteAdminUser(userId: string) {
  const { admin } = await requireAdmin()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- EMPRESAS CRUD ---
export async function createAdminCompany(data: {
  name: string
  document: string
  email: string
  razao_social?: string
  nome_fantasia?: string
  rntrc?: string
  city?: string
  state?: string
  phone?: string
}) {
  const { admin } = await requireAdmin()
  const doc = (data.document || '').replace(/\D/g, '')
  if (doc.length !== 14) return { success: false, error: 'CNPJ inválido' }
  const { error } = await admin.from('companies').insert({
    name: data.name || data.razao_social || data.nome_fantasia || 'Empresa',
    document: doc,
    email: data.email,
    razao_social: data.razao_social || data.name,
    nome_fantasia: data.nome_fantasia || data.name,
    rntrc: data.rntrc?.replace(/\D/g, '') || null,
    city: data.city || null,
    state: data.state || null,
    phone: data.phone || null,
    is_active: true,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateAdminCompany(
  companyId: string,
  data: Partial<{
    name: string
    document: string
    email: string
    razao_social: string
    nome_fantasia: string
    rntrc: string
    city: string
    state: string
    phone: string
  }>
) {
  const { admin } = await requireAdmin()
  const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
  if (updates.document) updates.document = String(updates.document).replace(/\D/g, '')
  if (updates.rntrc) updates.rntrc = String(updates.rntrc).replace(/\D/g, '')
  const { error } = await admin.from('companies').update(updates).eq('id', companyId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAdminCompany(companyId: string) {
  const { admin } = await requireAdmin()
  const { error } = await admin.from('companies').delete().eq('id', companyId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function toggleAdminCompanyActive(companyId: string) {
  const { admin } = await requireAdmin()
  const { data } = await admin.from('companies').select('is_active').eq('id', companyId).single()
  const next = !data?.is_active
  const { error } = await admin.from('companies').update({ is_active: next, updated_at: new Date().toISOString() }).eq('id', companyId)
  if (error) return { success: false, error: error.message }
  return { success: true, is_active: next }
}

// --- TRANSPORTADORAS (CARRIERS) CRUD ---
export async function createAdminCarrier(data: { user_id: string; company_id: string; rntrc?: string; company_name?: string }) {
  const { admin } = await requireAdmin()
  const { data: existing } = await admin.from('carriers').select('id').eq('user_id', data.user_id).single()
  if (existing) return { success: false, error: 'Este usuário já possui uma transportadora cadastrada' }
  const { error } = await admin
    .from('carriers')
    .insert({
      user_id: data.user_id,
      company_name: data.company_name || null,
      rntrc: data.rntrc?.replace(/\D/g, '') || null,
      rntrc_status: 'UNKNOWN',
    })
  if (error) return { success: false, error: error.message }
  await admin.from('profiles').update({ company_id: data.company_id, role: 'transportadora', updated_at: new Date().toISOString() }).eq('id', data.user_id)
  return { success: true }
}

export async function updateAdminCarrier(carrierId: string, data: { rntrc?: string; company_name?: string; rntrc_status?: string }) {
  const { admin } = await requireAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.rntrc != null) updates.rntrc = data.rntrc.replace(/\D/g, '')
  if (data.company_name != null) updates.company_name = data.company_name
  if (data.rntrc_status != null) updates.rntrc_status = data.rntrc_status
  const { error } = await admin.from('carriers').update(updates).eq('id', carrierId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAdminCarrier(carrierId: string) {
  const { admin } = await requireAdmin()
  const { data: carrier } = await admin.from('carriers').select('user_id').eq('id', carrierId).single()
  if (carrier?.user_id) {
    await admin.from('profiles').update({ company_id: null, role: 'cliente', updated_at: new Date().toISOString() }).eq('id', carrier.user_id)
  }
  const { error } = await admin.from('carriers').delete().eq('id', carrierId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- TABELAS DE FRETE (FREIGHT ROUTES) ---
export async function listAdminFreightRoutes(params: { carrierId?: string; page?: number; perPage?: number; search?: string }) {
  const { admin } = await requireAdmin()
  const page = params.page ?? 1
  const perPage = params.perPage ?? 50

  let query = admin
    .from('freight_routes')
    .select('id, carrier_id, origin_zip, dest_zip, origin_zip_end, dest_zip_end, price_per_kg, min_price, deadline_days, is_active, created_at', {
      count: 'exact',
    })

  if (params.carrierId) {
    // carrierId é o ID da company, precisamos encontrar o user_id associado
    const { data: profile } = await admin.from('profiles').select('id').eq('company_id', params.carrierId).eq('role', 'transportadora').limit(1).single()
    if (profile?.id) query = query.eq('carrier_id', profile.id)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) return { success: false, error: error.message }

  const carrierIds = [...new Set((data ?? []).map((r) => r.carrier_id).filter(Boolean))]
  const { data: profiles } = carrierIds.length ? await admin.from('profiles').select('id, company_id').in('id', carrierIds) : { data: [] }
  const companyIds = [...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean))]
  const { data: companies } = companyIds.length ? await admin.from('companies').select('id, nome_fantasia, razao_social, name').in('id', companyIds) : { data: [] }
  const companyById = new Map((companies ?? []).map((c) => [c.id, c]))
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const enriched = (data ?? []).map((r) => {
    const profile = profileById.get(r.carrier_id)
    const company = profile?.company_id ? companyById.get(profile.company_id) : null
    return {
      ...r,
      carrierName: company?.nome_fantasia || company?.razao_social || company?.name || 'N/A',
    }
  })

  return { success: true, data: { routes: enriched, total: count ?? 0 } }
}

export async function createAdminFreightRoute(data: {
  carrier_id: string
  origin_zip: string
  dest_zip: string
  cost_price_per_kg: number
  margin_percent: number
  min_price: number
  cost_min_price?: number
  deadline_days?: number
}) {
  const { admin } = await requireAdmin()
  const { data: carrier } = await admin.from('carriers').select('user_id').eq('id', data.carrier_id).single()
  const userId = carrier?.user_id
  if (!userId) return { success: false, error: 'Transportadora não encontrada' }
  const origin = String(data.origin_zip).replace(/\D/g, '').slice(0, 8)
  const dest = String(data.dest_zip).replace(/\D/g, '').slice(0, 8)
  const margin = Number(data.margin_percent) || 0
  const costPricePerKg = Number(data.cost_price_per_kg) || 0
  const publishedPricePerKg = costPricePerKg * (1 + margin / 100)
  const costMinPrice = Number(data.cost_min_price) || Number(data.min_price) || 0
  const publishedMinPrice = costMinPrice * (1 + margin / 100)
  const { error } = await admin.from('freight_routes').insert({
    carrier_id: userId,
    origin_zip: origin,
    dest_zip: dest,
    cost_price_per_kg: costPricePerKg,
    margin_percent: margin,
    cost_min_price: costMinPrice,
    price_per_kg: publishedPricePerKg,
    min_price: publishedMinPrice,
    deadline_days: Number(data.deadline_days) || 1,
    is_active: true,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateAdminFreightRoute(
  routeId: string,
  data: { origin_zip?: string; dest_zip?: string; price_per_kg?: number; min_price?: number; deadline_days?: number }
) {
  const { admin } = await requireAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.origin_zip != null) updates.origin_zip = String(data.origin_zip).replace(/\D/g, '').slice(0, 8)
  if (data.dest_zip != null) updates.dest_zip = String(data.dest_zip).replace(/\D/g, '').slice(0, 8)
  if (data.price_per_kg != null) updates.price_per_kg = Number(data.price_per_kg)
  if (data.min_price != null) updates.min_price = Number(data.min_price)
  if (data.deadline_days != null) updates.deadline_days = Number(data.deadline_days)
  const { error } = await admin.from('freight_routes').update(updates).eq('id', routeId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAdminFreightRoute(routeId: string) {
  const { admin } = await requireAdmin()
  const { error } = await admin.from('freight_routes').delete().eq('id', routeId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function toggleAdminFreightRouteActive(routeId: string) {
  const { admin } = await requireAdmin()
  const { data } = await admin.from('freight_routes').select('is_active').eq('id', routeId).single()
  const next = !(data?.is_active ?? true)
  const { error } = await admin.from('freight_routes').update({ is_active: next, updated_at: new Date().toISOString() }).eq('id', routeId)
  if (error) return { success: false, error: error.message }
  return { success: true, is_active: next }
}

export async function listAdminUsersForCarrierCreation() {
  const { admin } = await requireAdmin()
  const { data: carriers } = await admin.from('carriers').select('user_id')
  const hasCarrier = new Set((carriers ?? []).map((c) => c.user_id).filter(Boolean))
  const { data: users } = await admin.from('profiles').select('id, name, full_name, email, role').order('created_at', { ascending: false })
  return (users ?? []).map((u) => ({
    id: u.id,
    name: u.name || u.full_name || u.email || '-',
    email: u.email || '',
    role: u.role || '',
    hasCarrier: hasCarrier.has(u.id),
  }))
}

export async function listAdminCarriersForSelect() {
  const { admin } = await requireAdmin()
  const { data: carriers } = await admin.from('carriers').select('id, user_id, rntrc, company_name').order('company_name')
  const userIds = [...new Set((carriers ?? []).map((c) => c.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length ? await admin.from('profiles').select('id, company_id').in('id', userIds) : { data: [] }
  const companyIds = [...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean))]
  const { data: companies } = companyIds.length ? await admin.from('companies').select('id, nome_fantasia, razao_social, name').in('id', companyIds) : { data: [] }
  const companyById = new Map((companies ?? []).map((c) => [c.id, c]))
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  return (carriers ?? []).map((c) => {
    const profile = profileById.get(c.user_id)
    const company = profile?.company_id ? companyById.get(profile.company_id) : null
    return {
      id: c.id,
      label: company?.nome_fantasia || company?.razao_social || company?.name || c.company_name || c.rntrc || c.id,
    }
  })
}

// --- CARRIER APPROVAL FLOW ---

export async function listPendingCarriers(params: { status?: string } = {}) {
  const { admin } = await requireAdmin()
  const status = params.status ?? 'pending'

  const { data: companies, error } = await admin
    .from('companies')
    .select('id, razao_social, nome_fantasia, name, cnpj, rntrc, rntrc_number, insurance_file_url, approval_status, rejection_reason, created_at, email')
    .eq('approval_status', status)
    .order('created_at', { ascending: true })

  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data: companies ?? [] }
}

export async function approveCarrier(companyId: string, paymentTermDays: 7 | 21 | 28 = 7) {
  const { admin, user } = await requireAdmin()

  const { error } = await admin
    .from('companies')
    .update({
      is_active: true,
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      payment_term_days: paymentTermDays,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) return { success: false as const, error: error.message }

  // Notificar o usuário da transportadora
  const { data: profile } = await admin
    .from('profiles')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('role', 'transportadora')
    .single()

  if (profile) {
    void admin.from('notifications').insert({
      user_id: profile.id,
      company_id: companyId,
      title: 'Cadastro aprovado!',
      message: `Parabéns ${profile.name ?? ''}! Seu cadastro foi aprovado pela RotaClick. Nossa equipe irá incluir sua tabela de frete em breve e você começará a receber cotações.`,
      type: 'system',
      is_read: false,
    })
  }

  void admin.from('audit_logs').insert({
    action: 'carrier_approved',
    entity_type: 'company',
    entity_id: companyId,
    performed_by: user.id,
    details: { approved_at: new Date().toISOString() },
  })

  return { success: true as const }
}

export async function rejectCarrier(companyId: string, reason: string) {
  const { admin, user } = await requireAdmin()

  const { error } = await admin
    .from('companies')
    .update({
      is_active: false,
      approval_status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) return { success: false as const, error: error.message }

  // Notificar o usuário da transportadora
  const { data: profile } = await admin
    .from('profiles')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('role', 'transportadora')
    .single()

  if (profile) {
    void admin.from('notifications').insert({
      user_id: profile.id,
      company_id: companyId,
      title: 'Cadastro não aprovado',
      message: `Olá ${profile.name ?? ''}. Infelizmente seu cadastro não foi aprovado. Motivo: ${reason}. Entre em contato com suporte@rotaclick.com.br para mais informações.`,
      type: 'system',
      is_read: false,
    })
  }

  void admin.from('audit_logs').insert({
    action: 'carrier_rejected',
    entity_type: 'company',
    entity_id: companyId,
    performed_by: user.id,
    details: { reason, rejected_at: new Date().toISOString() },
  })

  return { success: true as const }
}

// --- FINANCIAL / REPASSE ---

export async function listAdminRepasses(params: { status?: string; carrierId?: string } = {}) {
  const { admin } = await requireAdmin()

  let query = admin
    .from('freights')
    .select('id, carrier_id, price, cost_price, carrier_amount, rotaclick_amount, payment_term_days, repasse_due_date, repasse_status, repasse_paid_at, created_at, origin_zip, dest_zip, client_name, payment_status')
    .eq('payment_status', 'paid')
    .order('repasse_due_date', { ascending: true })

  if (params.status) query = query.eq('repasse_status', params.status)
  if (params.carrierId) query = query.eq('carrier_id', params.carrierId)

  const { data, error } = await query
  if (error) return { success: false as const, error: error.message }

  // Enrich with carrier name
  const carrierIds = [...new Set((data ?? []).map((f) => f.carrier_id).filter(Boolean))]
  const { data: profiles } = carrierIds.length
    ? await admin.from('profiles').select('id, company_id').in('id', carrierIds)
    : { data: [] }
  const companyIds = [...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean))]
  const { data: companies } = companyIds.length
    ? await admin.from('companies').select('id, nome_fantasia, razao_social, name, payment_term_days').in('id', companyIds)
    : { data: [] }
  const companyById = new Map((companies ?? []).map((c) => [c.id, c]))
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const enriched = (data ?? []).map((f) => {
    const profile = profileById.get(f.carrier_id)
    const company = profile?.company_id ? companyById.get(profile.company_id) : null
    return { ...f, carrierName: company?.nome_fantasia || company?.razao_social || company?.name || '—' }
  })

  return { success: true as const, data: enriched }
}

export async function markRepasePaid(freightId: string) {
  const { admin, user } = await requireAdmin()

  // Fetch freight details before updating
  const { data: freight } = await admin
    .from('freights')
    .select('carrier_id, carrier_amount, carrier_name, origin_zip, dest_zip')
    .eq('id', freightId)
    .single()

  const { error } = await admin
    .from('freights')
    .update({
      repasse_status: 'paid',
      repasse_paid_at: new Date().toISOString(),
      repasse_paid_by: user.id,
    })
    .eq('id', freightId)
  if (error) return { success: false as const, error: error.message }

  // Notify carrier via internal notification
  if (freight?.carrier_id) {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    const fmtCep = (z: string | null) => z ? `${z.slice(0,5)}-${z.slice(5)}` : ''
    const route = freight.origin_zip && freight.dest_zip
      ? ` (${fmtCep(freight.origin_zip)} → ${fmtCep(freight.dest_zip)})`
      : ''
    const amount = fmt(Number(freight.carrier_amount) || 0)

    // Fetch company_id for the notification
    const { data: profile } = await admin
      .from('profiles')
      .select('company_id')
      .eq('id', freight.carrier_id)
      .maybeSingle()

    void admin.from('notifications').insert({
      user_id: freight.carrier_id,
      company_id: profile?.company_id ?? null,
      title: 'Repasse realizado!',
      message: `A RotaClick realizou o repasse de ${amount}${route}. O valor já está disponível para saque.`,
      type: 'system',
      is_read: false,
    })
  }

  void admin.from('audit_logs').insert({
    action: 'repasse_paid',
    entity_type: 'freight',
    entity_id: freightId,
    performed_by: user.id,
    details: { paid_at: new Date().toISOString(), carrier_amount: freight?.carrier_amount },
  })
  return { success: true as const }
}

export async function getCarrierFinancialSummary(carrierId: string) {
  const { admin } = await requireAdmin()
  const { data, error } = await admin
    .from('freights')
    .select('price, carrier_amount, rotaclick_amount, repasse_status, repasse_due_date, created_at')
    .eq('carrier_id', carrierId)
    .eq('payment_status', 'paid')
  if (error) return { success: false as const, error: error.message }
  const rows = data ?? []
  const totalRevenue = rows.reduce((s, r) => s + (Number(r.price) || 0), 0)
  const totalCarrierAmount = rows.reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)
  const totalRotaclick = rows.reduce((s, r) => s + (Number(r.rotaclick_amount) || 0), 0)
  const pending = rows.filter((r) => r.repasse_status === 'pending')
  const paid = rows.filter((r) => r.repasse_status === 'paid')
  return {
    success: true as const,
    data: { totalRevenue, totalCarrierAmount, totalRotaclick, pendingCount: pending.length, paidCount: paid.length, freights: rows },
  }
}
