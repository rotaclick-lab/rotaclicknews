'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0

  return remainder === Number(cpf[10])
}

function isValidCNPJ(value: string): boolean {
  const cnpj = value.replace(/\D/g, '')
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const calcDigit = (base: string, factors: number[]) => {
    const total = base.split('').reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const digit1 = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const digit2 = calcDigit(cnpj.slice(0, 12) + String(digit1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return cnpj.endsWith(`${digit1}${digit2}`)
}

async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const normalized = identifier.trim()

  if (!normalized) return null
  if (normalized.includes('@')) return normalized.toLowerCase()

  const digits = normalized.replace(/\D/g, '')
  const admin = createAdminClient()

  if (digits.length === 11) {
    const { data, error } = await admin
      .from('profiles')
      .select('email')
      .eq('cpf', digits)
      .maybeSingle()

    if (error) {
      console.error('Erro ao resolver CPF para login:', error)
      return null
    }

    return data?.email ?? null
  }

  if (digits.length === 14) {
    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id, email')
      .eq('document', digits)
      .maybeSingle()

    if (companyError) {
      console.error('Erro ao resolver CNPJ para login (companies):', companyError)
      return null
    }

    if (company?.email) {
      return company.email
    }

    if (!company?.id) return null

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('email')
      .eq('company_id', company.id)
      .eq('role', 'transportadora')
      .limit(1)

    if (profileError) {
      console.error('Erro ao resolver CNPJ para login (profiles):', profileError)
      return null
    }

    return profiles?.[0]?.email ?? null
  }

  return null
}

async function resolveDefaultRedirectByRole(userId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao resolver role para redirecionamento:', error)
    return '/dashboard'
  }

  if (profile?.role === 'cliente') {
    return '/cliente'
  }

  return '/dashboard'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const identifier = ((formData.get('identifier') as string) || (formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''
  const next = ((formData.get('next') as string) || '').trim()

  const resolvedEmail = await resolveLoginEmail(identifier)

  if (!resolvedEmail) {
    return { error: 'Credenciais inválidas. Use email, CPF ou CNPJ válidos.' }
  }

  const data = {
    email: resolvedEmail,
    password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const normalizedMessage = (error.message || '').toLowerCase()
    const errorCode = (error as { code?: string }).code || ''
    const isEmailNotConfirmed =
      errorCode === 'email_not_confirmed' ||
      normalizedMessage.includes('email not confirmed') ||
      normalizedMessage.includes('email_not_confirmed') ||
      normalizedMessage.includes('confirm')

    if (isEmailNotConfirmed) {
      return {
        error:
          'Seu cadastro ainda não foi confirmado. Verifique seu e-mail e clique no link de confirmação enviado pela RotaClick. Se não encontrar, confira a caixa de spam.',
      }
    }

    return { error: 'Credenciais inválidas. Verifique seu acesso e tente novamente.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  revalidatePath('/', 'layout')
  const defaultRedirect = user ? await resolveDefaultRedirectByRole(user.id) : '/dashboard'
  const safeRedirect = next.startsWith('/') ? next : defaultRedirect
  redirect(safeRedirect)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const next = ((formData.get('next') as string) || '').trim()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
        company_name: formData.get('companyName') as string,
        cnpj: formData.get('cnpj') as string,
        role: 'transportadora',
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  const safeRedirect = next.startsWith('/') ? next : '/dashboard'
  redirect(safeRedirect)
}

export async function signupCustomer(formData: FormData) {
  const supabase = await createClient()
  const next = ((formData.get('next') as string) || '').trim()

  const personType = ((formData.get('personType') as string) || 'pf').toLowerCase()
  const fullName = ((formData.get('fullName') as string) || '').trim()
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const phone = ((formData.get('phone') as string) || '').replace(/\D/g, '')
  const cpf = ((formData.get('cpf') as string) || '').replace(/\D/g, '')
  const cnpj = ((formData.get('cnpj') as string) || '').replace(/\D/g, '')
  const cep = ((formData.get('cep') as string) || '').replace(/\D/g, '')
  const street = ((formData.get('street') as string) || '').trim()
  const number = ((formData.get('number') as string) || '').trim()
  const complement = ((formData.get('complement') as string) || '').trim()
  const neighborhood = ((formData.get('neighborhood') as string) || '').trim()
  const city = ((formData.get('city') as string) || '').trim()
  const state = (((formData.get('state') as string) || '').trim().toUpperCase() || '').slice(0, 2)
  const acceptTerms = String(formData.get('acceptTerms') || '') === 'true'

  if (!acceptTerms) {
    return { error: 'Você precisa aceitar os termos para continuar.' }
  }

  if (!['pf', 'pj'].includes(personType)) {
    return { error: 'Tipo de pessoa inválido.' }
  }

  if (fullName.length < 3) {
    return { error: 'Informe o nome completo para cadastro.' }
  }

  if (!email) {
    return { error: 'Informe o e-mail para cadastro.' }
  }

  if (!emailRegex.test(email)) {
    return { error: 'E-mail inválido.' }
  }

  if (!phone) {
    return { error: 'Informe o telefone para cadastro.' }
  }

  if (phone.length < 10 || phone.length > 11) {
    return { error: 'Telefone inválido.' }
  }

  if (password.length < 8) {
    return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  }

  if (!cep || cep.length !== 8) {
    return { error: 'CEP inválido.' }
  }

  if (!street) {
    return { error: 'Informe o logradouro.' }
  }

  if (!number) {
    return { error: 'Informe o número do endereço.' }
  }

  if (!neighborhood) {
    return { error: 'Informe o bairro.' }
  }

  if (!city) {
    return { error: 'Informe a cidade.' }
  }

  if (!state || !/^[A-Z]{2}$/.test(state)) {
    return { error: 'UF inválida.' }
  }

  if (personType === 'pf') {
    if (!cpf) {
      return { error: 'CPF é obrigatório para pessoa física.' }
    }

    if (cpf.length !== 11 || !isValidCPF(cpf)) {
      return { error: 'CPF inválido.' }
    }
  }

  if (personType === 'pj') {
    if (!cnpj) {
      return { error: 'CNPJ é obrigatório para pessoa jurídica.' }
    }

    if (cnpj.length !== 14 || !isValidCNPJ(cnpj)) {
      return { error: 'CNPJ inválido.' }
    }
  }

  const admin = createAdminClient()

  const address = {
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: 'cliente',
        person_type: personType,
        cpf: personType === 'pf' ? cpf : '',
        cnpj: personType === 'pj' ? cnpj : '',
        address,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user?.id) {
    const profilePayload = {
      id: data.user.id,
      name: fullName,
      email,
      phone,
      role: 'cliente',
      cpf: personType === 'pf' ? cpf : null,
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      console.error('Erro ao atualizar perfil de cliente:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  const safeRedirect = next.startsWith('/') ? next : '/cliente'
  redirect(safeRedirect)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// Alias for logout (used in some components)
export const signOut = logout

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Email de recuperação enviado com sucesso!' }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
