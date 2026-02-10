'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth.schema'
import { signup } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const acceptTerms = watch('acceptTerms')

  // Preenchimento automático via SessionStorage (mais seguro contra URLs longas)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('carrier_data')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          if (data.cnpj) setValue('cnpj', data.cnpj)
          if (data.fantasia || data.razao) setValue('companyName', data.fantasia || data.razao)
        } catch (e) {
          console.error('Erro ao ler dados da transportadora', e)
        }
      }
    }
  }, [setValue])

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('fullName', data.fullName)
    formData.append('companyName', data.companyName)
    formData.append('cnpj', data.cnpj)
    
    const result = await signup(formData)
    
    if (result?.error) {
      toast({
        title: 'Erro ao criar conta',
        description: result.error,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setValue('cnpj', value, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="João Silva"
          className="focus-visible:ring-brand-500"
          {...register('fullName')}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          className="focus-visible:ring-brand-500"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Nome da Empresa</Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Transportadora XYZ"
          className="focus-visible:ring-brand-500"
          {...register('companyName')}
          disabled={isLoading}
        />
        {errors.companyName && (
          <p className="text-sm text-red-500">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          type="text"
          placeholder="00.000.000/0000-00"
          className="focus-visible:ring-brand-500"
          {...register('cnpj')}
          onChange={handleCNPJChange}
          disabled={isLoading}
          maxLength={14}
        />
        {errors.cnpj && (
          <p className="text-sm text-red-500">{errors.cnpj.message}</p>
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          className="focus-visible:ring-brand-500"
          {...register('confirmPassword')}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean, { shouldValidate: true })}
          disabled={isLoading}
          className="data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500"
        />
        <label
          htmlFor="acceptTerms"
          className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Aceito os{' '}
          <Link href="/termos" className="text-brand-600 hover:underline">
            termos de uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="text-brand-600 hover:underline">
            política de privacidade
          </Link>
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
      )}

      <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold" disabled={isLoading}>
        {isLoading ? 'Criando conta...' : 'Criar conta'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-semibold">
          Faça login
        </Link>
      </p>
    </form>
  )
}
