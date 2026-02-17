import { createClient } from '@supabase/supabase-js'

// Admin client com service_role key - APENAS para uso em server actions
// Bypassa RLS (Row Level Security) - usar com cuidado
// NUNCA importar este arquivo em componentes client-side
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
