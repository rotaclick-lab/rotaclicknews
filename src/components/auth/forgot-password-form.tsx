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

function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [identifierValue, setIdentifierValue] = useState('')
  const { toast } = useToast()
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('identifier', data.identifier)
    
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
        <Alert className="border-brand-200 bg-brand-50">
          <CheckCircle2 className="h-4 w-4 text-brand-600" />
          <AlertTitle className="text-brand-800">Email enviado com sucesso!</AlertTitle>
          <AlertDescription className="text-brand-700">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </AlertDescription>
        </Alert>
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
        <Label htmlFor="identifier">CPF ou CNPJ</Label>
        <Input
          id="identifier"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className="h-12 rounded-lg border-brand-100 focus-visible:ring-brand-500"
          value={identifierValue}
          onChange={(e) => {
            const masked = maskCpfCnpj(e.target.value)
            setIdentifierValue(masked)
            setValue('identifier', masked)
          }}
          disabled={isLoading}
        />
        {errors.identifier && (
          <p className="text-sm text-red-500">{errors.identifier.message}</p>
        )}
      </div>

      <Button type="submit" className="h-12 w-full rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600" disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
      </Button>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </form>
  )
}
