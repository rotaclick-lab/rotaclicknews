import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Login - RotaClick',
  description: 'Faça login no RotaClick',
}

export default function LoginPage() {
  return (
    <Card className="border-brand-200 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <Image src="/logo.png" alt="RotaClick" width={180} height={90} priority />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-700">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
