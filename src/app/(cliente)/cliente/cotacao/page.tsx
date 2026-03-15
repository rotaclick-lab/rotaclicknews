'use client'

import { Suspense } from 'react'
import { CotacaoWizard } from '@/components/cotacao/cotacao-wizard'

export default function ClienteCotacaoPage() {
  return (
    <Suspense>
      <CotacaoWizard basePath="/cliente/cotacao" backPath="/cliente" />
    </Suspense>
  )
}
