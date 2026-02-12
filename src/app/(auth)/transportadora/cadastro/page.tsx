'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CadastroTransportadoraPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/registro')
  }, [router])

  return null

}
