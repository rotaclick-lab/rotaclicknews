'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
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
