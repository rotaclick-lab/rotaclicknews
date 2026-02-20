'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth.schema'
import { resetPassword } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null)
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const checkSession = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Troca o code por sessão (fluxo PKCE do Supabase)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setHasValidSession(false)
          return
        }
        // Remove o code da URL sem recarregar
        window.history.replaceState({}, '', window.location.pathname)
      }

      const { data: { session } } = await supabase.auth.getSession()
      setHasValidSession(!!session)
    }
    checkSession()
  }, [])

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('password', data.password)

    const result = await resetPassword(formData)

    if (result?.error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: result.error,
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  if (hasValidSession === null) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (!hasValidSession) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Link inválido ou expirado</AlertTitle>
          <AlertDescription className="text-red-700">
            O link de recuperação de senha expirou ou é inválido. Solicite um novo email de recuperação.
          </AlertDescription>
        </Alert>
        <Link href="/esqueci-senha" className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline">
          Solicitar novo email
        </Link>
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          className="h-12 rounded-lg border-brand-100 focus-visible:ring-brand-500"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          className="h-12 rounded-lg border-brand-100 focus-visible:ring-brand-500"
          {...register('confirmPassword')}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="h-12 w-full rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600" disabled={isLoading}>
        {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
      </Button>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </form>
  )
}
