'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ClienteProfileData {
  full_name: string
  phone: string
  cpf: string
  cnpj: string
  person_type: 'pf' | 'pj'
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export async function getClienteProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, name, email, phone, cpf, role, created_at')
    .eq('id', user.id)
    .single()

  if (error) return { error: 'Erro ao buscar perfil' }

  const meta = user.user_metadata ?? {}
  const address = meta.address ?? {}

  return {
    data: {
      full_name: profile.full_name ?? profile.name ?? '',
      email: profile.email ?? user.email ?? '',
      phone: profile.phone ?? meta.phone ?? '',
      cpf: profile.cpf ?? meta.cpf ?? '',
      cnpj: meta.cnpj ?? '',
      person_type: (meta.person_type ?? (profile.cpf ? 'pf' : 'pj')) as 'pf' | 'pj',
      cep: address.cep ?? '',
      street: address.street ?? '',
      number: address.number ?? '',
      complement: address.complement ?? '',
      neighborhood: address.neighborhood ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      created_at: profile.created_at,
    },
  }
}

export async function updateClienteProfile(data: ClienteProfileData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const address = {
    cep: data.cep.replace(/\D/g, ''),
    street: data.street.trim(),
    number: data.number.trim(),
    complement: data.complement.trim(),
    neighborhood: data.neighborhood.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase().slice(0, 2),
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name.trim(),
      name: data.full_name.trim(),
      phone: data.phone.replace(/\D/g, ''),
      cpf: data.person_type === 'pf' ? data.cpf.replace(/\D/g, '') : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) return { error: 'Erro ao atualizar perfil' }

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      full_name: data.full_name.trim(),
      phone: data.phone.replace(/\D/g, ''),
      person_type: data.person_type,
      cpf: data.person_type === 'pf' ? data.cpf.replace(/\D/g, '') : '',
      cnpj: data.person_type === 'pj' ? data.cnpj.replace(/\D/g, '') : '',
      address,
    },
  })

  if (metaError) return { error: 'Erro ao atualizar metadados' }

  revalidatePath('/cliente/perfil')
  revalidatePath('/cliente')

  return { success: true }
}

export async function changeClientePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInError) return { error: 'Senha atual incorreta' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: 'Erro ao alterar senha' }

  return { success: true }
}
