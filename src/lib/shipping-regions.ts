/**
 * Sistema de regiões de entrega
 * Encontra a região correspondente a um CEP usando faixas
 */

export interface ShippingRegion {
  id: string
  name: string
  city: string
  state: string
  representative_cep: string
  cep_start: string
  cep_end: string
  is_active: boolean
}

/**
 * Encontra a região correspondente a um CEP
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns região encontrada ou null
 */
export async function findRegionByCep(cep: string): Promise<ShippingRegion | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  
  // Normalizar CEP para comparação
  const normalizedCep = cep.replace(/\D/g, '')
  
  // Buscar região que contém este CEP
  const { data, error } = await admin
    .from('shipping_regions')
    .select('*')
    .eq('is_active', true)
    .lte('cep_start', normalizedCep)
    .gte('cep_end', normalizedCep)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as ShippingRegion
}

/**
 * Converte um CEP para o CEP representativo de sua região
 * @param cep - CEP original
 * @returns CEP representativo da região ou o original se não encontrar
 */
export async function normalizeCepToRegion(cep: string): Promise<string> {
  const region = await findRegionByCep(cep)
  
  if (!region) {
    // Se não encontrar região, retorna o CEP formatado
    return formatCep(cep)
  }
  
  return region.representative_cep
}

/**
 * Formata CEP para padrão 00000-000
 */
export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return cep
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Verifica se um CEP está em alguma região cadastrada
 */
export async function isCepCovered(cep: string): Promise<boolean> {
  const region = await findRegionByCep(cep)
  return region !== null
}
