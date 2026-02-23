/**
 * Sistema de regiões de entrega com ViaCEP
 * Encontra a região correspondente a um CEP usando faixas + API ViaCEP
 */

import { buscarCEP } from './viacep'

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
 * 1. Tenta encontrar na tabela de regiões (faixas pré-cadastradas)
 * 2. Se não encontrar, usa ViaCEP para identificar cidade/estado
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns região encontrada ou null
 */
export async function findRegionByCep(cep: string): Promise<ShippingRegion | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  
  // Normalizar CEP para comparação
  const normalizedCep = cep.replace(/\D/g, '')
  
  // 1. Buscar região que contém este CEP (faixas pré-cadastradas)
  const { data, error } = await admin
    .from('shipping_regions')
    .select('*')
    .eq('is_active', true)
    .lte('cep_start', normalizedCep)
    .gte('cep_end', normalizedCep)
    .single()
  
  if (data && !error) {
    return data as ShippingRegion
  }
  
  // 2. Se não encontrar em faixas, usar ViaCEP
  console.log('ViaCEP - Buscando CEP:', cep)
  const dadosCEP = await buscarCEP(cep)
  
  if (!dadosCEP) {
    console.log('ViaCEP - CEP não encontrado:', cep)
    return null
  }
  
  console.log('ViaCEP - CEP encontrado:', { cidade: dadosCEP.localidade, uf: dadosCEP.uf })
  
  // Buscar região pela cidade/estado encontrada no ViaCEP
  const { data: regionByCity } = await admin
    .from('shipping_regions')
    .select('*')
    .eq('is_active', true)
    .eq('city', dadosCEP.localidade)
    .eq('state', dadosCEP.uf)
    .limit(1)
    .single()
  
  console.log('ViaCEP - Região encontrada por cidade:', regionByCity ? 'SIM' : 'NÃO')
  return regionByCity as ShippingRegion || null
}

/**
 * Converte um CEP para o CEP representativo de sua região
 * @param cep - CEP original
 * @returns CEP representativo da região ou o original se não encontrar
 */
export async function normalizeCepToRegion(cep: string): Promise<string> {
  const region = await findRegionByCep(cep)
  
  if (!region) {
    // Se não encontrar região, tenta usar ViaCEP para obter um CEP válido
    const dadosCEP = await buscarCEP(cep)
    if (dadosCEP) {
      return dadosCEP.cep
    }
    // Se não encontrar nada, retorna o CEP formatado
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
