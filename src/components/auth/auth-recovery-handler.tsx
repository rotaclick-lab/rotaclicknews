'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Redireciona para /auth/reset-password quando o usuário chega com hash de recuperação
 * (access_token + type=recovery). O Supabase usa fluxo implícito em alguns casos.
 */
export function AuthRecoveryHandler() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')
    const accessToken = params.get('access_token')

    if (type === 'recovery' && accessToken && pathname !== '/auth/reset-password') {
      window.location.replace(`/auth/reset-password${hash}`)
    }
  }, [pathname])

  return null
}
