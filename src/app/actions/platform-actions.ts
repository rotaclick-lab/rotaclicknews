'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado')
  return { user, admin: createAdminClient() }
}

async function logAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      metadata: metadata ?? null,
    })
  } catch {
    // audit log failure should not break the main action
  }
}

// ===== PLATFORM SETTINGS =====

export async function getPlatformSettings() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_settings')
      .select('key, value, value_json, description')
      .order('key')
    if (error) return { success: false, error: error.message }
    const map: Record<string, string> = {}
    for (const row of data ?? []) {
      map[row.key] = row.value ?? ''
    }
    return { success: true, data: map, rows: data ?? [] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updatePlatformSetting(key: string, value: string) {
  try {
    const { user, admin } = await requireAdmin()
    const { error } = await admin
      .from('platform_settings')
      .upsert(
        { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'UPDATE', 'platform_settings', key, `Configuração "${key}" atualizada para "${value}"`)
    revalidatePath('/', 'layout')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updatePlatformSettingsBatch(settings: Record<string, string>) {
  try {
    const { user, admin } = await requireAdmin()
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await admin
      .from('platform_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'UPDATE', 'platform_settings', null, `${rows.length} configurações atualizadas em lote`, { keys: Object.keys(settings) })
    revalidatePath('/', 'layout')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ===== CAMPAIGNS =====

export type Campaign = {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  image_url: string | null
  link_url: string | null
  link_label: string | null
  bg_color: string | null
  text_color: string | null
  carrier_id: string | null
  position: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export async function listCampaigns(params?: { type?: string; status?: string }) {
  try {
    const { admin } = await requireAdmin()
    let query = admin
      .from('campaigns')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
    if (params?.type) query = query.eq('type', params.type)
    if (params?.status) query = query.eq('status', params.status)
    const { data, error } = await query
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as Campaign[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function listActiveCampaigns() {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data, error } = await admin
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('position', { ascending: true })
    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as Campaign[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createCampaign(data: {
  title: string
  description?: string
  type: string
  status?: string
  image_url?: string
  link_url?: string
  link_label?: string
  bg_color?: string
  text_color?: string
  carrier_id?: string
  position?: number
  starts_at?: string
  ends_at?: string
}) {
  try {
    const { user, admin } = await requireAdmin()
    const { data: created, error } = await admin
      .from('campaigns')
      .insert({
        ...data,
        status: data.status ?? 'active',
        position: data.position ?? 0,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'CREATE', 'campaigns', created.id, `Campanha "${data.title}" criada`)
    revalidatePath('/')
    revalidatePath('/admin/campanhas')
    return { success: true, data: created as Campaign }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    title: string
    description: string
    type: string
    status: string
    image_url: string
    link_url: string
    link_label: string
    bg_color: string
    text_color: string
    carrier_id: string
    position: number
    starts_at: string
    ends_at: string
  }>
) {
  try {
    const { user, admin } = await requireAdmin()
    const { error } = await admin
      .from('campaigns')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'UPDATE', 'campaigns', id, `Campanha "${id}" atualizada`)
    revalidatePath('/')
    revalidatePath('/admin/campanhas')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteCampaign(id: string) {
  try {
    const { user, admin } = await requireAdmin()
    const { error } = await admin.from('campaigns').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'DELETE', 'campaigns', id, `Campanha "${id}" excluída`)
    revalidatePath('/')
    revalidatePath('/admin/campanhas')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function toggleCampaignStatus(id: string) {
  try {
    const { user, admin } = await requireAdmin()
    const { data } = await admin.from('campaigns').select('status').eq('id', id).single()
    const next = data?.status === 'active' ? 'inactive' : 'active'
    const { error } = await admin.from('campaigns').update({ status: next, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { success: false, error: error.message }
    await logAdminAction(user.id, 'UPDATE', 'campaigns', id, `Campanha "${id}" ${next === 'active' ? 'ativada' : 'desativada'}`)
    revalidatePath('/')
    revalidatePath('/admin/campanhas')
    return { success: true, status: next }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ===== ADMIN AUDIT LOG (manual) =====

export async function logAction(
  action: string,
  resourceType: string,
  resourceId: string | null,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await logAdminAction(user.id, action, resourceType, resourceId, description, metadata)
  } catch {
    // silent
  }
}

// ===== ADMIN: listar todos os logs com enriquecimento de usuário =====

export async function listAllAuditLogs(params: {
  page?: number
  perPage?: number
  action?: string
  resourceType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}) {
  try {
    const { admin } = await requireAdmin()
    const page = params.page ?? 1
    const perPage = params.perPage ?? 50

    let query = admin
      .from('audit_logs')
      .select('id, user_id, action, resource_type, resource_id, description, metadata, before_data, after_data, ip_address, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params.action) query = query.eq('action', params.action)
    if (params.resourceType) query = query.eq('resource_type', params.resourceType)
    if (params.userId) query = query.eq('user_id', params.userId)
    if (params.dateFrom) query = query.gte('created_at', `${params.dateFrom}T00:00:00`)
    if (params.dateTo) query = query.lte('created_at', `${params.dateTo}T23:59:59`)

    query = query.range((page - 1) * perPage, page * perPage - 1)

    const { data, count, error } = await query
    if (error) return { success: false, error: error.message }

    const userIds = [...new Set((data ?? []).map((l) => l.user_id).filter(Boolean))]
    const { data: profiles } = userIds.length
      ? await admin.from('profiles').select('id, name, full_name, email').in('id', userIds)
      : { data: [] }

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

    const enriched = (data ?? []).map((log) => ({
      ...log,
      user_name: profileById.get(log.user_id)?.name ||
        profileById.get(log.user_id)?.full_name ||
        profileById.get(log.user_id)?.email ||
        'sistema',
    }))

    return { success: true, data: enriched, total: count ?? 0 }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
