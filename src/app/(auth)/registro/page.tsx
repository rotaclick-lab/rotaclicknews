import Image from 'next/image'
import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'

export const metadata = {
  title: 'Cadastro - RotaClick',
  description: 'Crie sua conta no RotaClick',
}

export default function RegisterPage() {
  return (
    <Card className="border-brand-200 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <Image src="/logo.png" alt="RotaClick" width={180} height={90} priority />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-700">Crie sua conta</CardTitle>
        <CardDescription>
          Comece a gerenciar seus fretes de forma inteligente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="flex items-center justify-center p-8">Carregando formulário...</div>}>
          <RegisterForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
