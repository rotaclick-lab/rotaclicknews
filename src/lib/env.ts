import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  ZAPI_INSTANCE_ID: z.string().min(1).optional(),
  ZAPI_TOKEN: z.string().min(1).optional(),
  ZAPI_PHONE: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

let _validated = false

export function validateEnv() {
  if (_validated) return
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ')
    console.error(`[ENV] Variáveis de ambiente inválidas ou ausentes: ${missing}`)
    console.error(result.error.format())
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing}`)
    }
  }
  _validated = true
}
