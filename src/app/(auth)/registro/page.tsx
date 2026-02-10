import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'

export const metadata = {
  title: 'Cadastro - RotaClick',
  description: 'Crie sua conta no RotaClick',
}

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">🚛 RotaClick</CardTitle>
        <CardDescription>
          Crie sua conta e comece a gerenciar seus fretes
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
