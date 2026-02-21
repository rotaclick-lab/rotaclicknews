'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Erro no painel admin</h2>
        <p className="text-sm text-muted-foreground">
          Verifique se a variável <code className="bg-slate-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> está
          configurada no ambiente de produção (Vercel).
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Tentar novamente
          </Button>
          <Button asChild>
            <Link href="/admin">Voltar ao admin</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
