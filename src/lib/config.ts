/**
 * Configuração centralizada da aplicação
 * 
 * Este arquivo contém todas as configurações do app,
 * facilitando manutenção e mudanças de ambiente.
 */

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'RotaClick',
    description: 'Sistema de Gestão de Fretes para Transportadoras',
    url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  auth: {
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    loginUrl: '/login',
    registerUrl: '/cadastro',
    dashboardUrl: '/dashboard',
    forgotPasswordUrl: '/esqueci-senha',
  },
  
  features: {
    enableMarketplace: true,
    enableFinancial: true,
    enableReports: true,
    enableGoogleMaps: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    enablePayments: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  },
  
  integrations: {
    googleMaps: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      enabled: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      enabled: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
  },
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

export type Config = typeof config

// Validação de variáveis obrigatórias em produção
if (config.isProduction) {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ]
  
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  )
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingVars.join(', ')}`
    )
  }
}
