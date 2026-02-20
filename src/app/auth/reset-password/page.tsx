import Image from 'next/image'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Redefinir senha - RotaClick',
  description: 'Defina sua nova senha',
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Card className="w-full rounded-2xl border-brand-100 bg-white/95 shadow-xl shadow-brand-200/30 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="RotaClick" width={220} height={70} className="h-16 w-auto object-contain" priority />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-700">Redefinir senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
