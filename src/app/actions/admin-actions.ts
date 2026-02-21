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
