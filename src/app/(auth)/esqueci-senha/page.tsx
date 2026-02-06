import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Esqueci minha senha - RotaClick',
  description: 'Recupere sua senha',
}

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Esqueceu sua senha?</CardTitle>
        <CardDescription>
          Digite seu email e enviaremos instruções para redefinir sua senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  )
}
