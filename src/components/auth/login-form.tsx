'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth.schema'
import { login } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface LoginFormProps {
  next?: string
}

export function LoginForm({ next }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('identifier', data.identifier)
    formData.append('password', data.password)
    if (next) {
      formData.append('next', next)
    }
    
    const result = await login(formData)
    
    if (result?.error) {
      toast({
        title: 'Erro ao fazer login',
        description: result.error,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Email, CPF ou CNPJ</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="seu@email.com ou 000.000.000-00"
          className="focus-visible:ring-brand-500"
          {...register('identifier')}
          disabled={isLoading}
        />
        {errors.identifier && (
          <p className="text-sm text-red-500">{errors.identifier.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="focus-visible:ring-brand-500"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>

      <div className="text-center space-y-2 text-sm">
        <Link href="/esqueci-senha" className="text-brand-600 hover:text-brand-700 hover:underline block">
          Esqueceu sua senha?
        </Link>
        <p className="text-muted-foreground">
          Não tem uma conta?{' '}
          <Link
            href={next ? `/cadastro?next=${encodeURIComponent(next)}` : '/cadastro'}
            className="text-orange-500 hover:text-orange-600 hover:underline font-semibold"
          >
            Cadastre-se
          </Link>
        </p>
        <p className="text-muted-foreground">
          É transportadora?{' '}
          <Link href="/registro-transportadora" className="text-brand-600 hover:text-brand-700 hover:underline font-semibold">
            Cadastre sua empresa
          </Link>
        </p>
      </div>
    </form>
  )
}
