import { createClient } from './server'

export async function getSession() {
  const supabase = await createClient()
  // Usar getUser() para validar o token no servidor Supabase Auth
  // getSession() apenas lê do cookie local e pode estar desatualizado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    throw new Error('Não autenticado')
  }
  return user
}
