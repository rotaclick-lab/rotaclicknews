import Image from 'next/image'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Login - RotaClick',
  description: 'Faça login no RotaClick',
}

interface LoginPageProps {
  searchParams?: {
    next?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams?.next

  return (
    <div className="space-y-4">
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o início
      </Link>
      
      <Card className="border-brand-200 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="RotaClick" width={220} height={70} className="h-16 w-auto object-contain" priority />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-700">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm {...(next ? { next } : {})} />
        </CardContent>
      </Card>
    </div>
  )
}
