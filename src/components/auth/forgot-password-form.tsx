'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth.schema'
import { forgotPassword } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', data.email)
    
    const result = await forgotPassword(formData)
    
    if (result?.error) {
      toast({
        title: 'Erro ao enviar email',
        description: result.error,
        variant: 'destructive',
      })
      setIsLoading(false)
    } else if (result?.success) {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Email enviado com sucesso!</AlertTitle>
          <AlertDescription>
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </AlertDescription>
        </Alert>
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
      </Button>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </form>
  )
}
