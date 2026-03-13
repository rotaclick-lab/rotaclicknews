'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { loginAdmin } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha e-mail e senha')
      return
    }
    setLoading(true)
    const result = await loginAdmin(email.trim(), password)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <div className="w-full space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o início
        </Link>

        <Card className="rounded-2xl border-brand-100 bg-white/95 shadow-xl shadow-brand-200/30 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <Logo width={220} height={70} className="h-16 w-auto object-contain" priority />
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 border border-red-100">
                <Shield className="h-3.5 w-3.5" /> Acesso Administrativo
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-brand-700 pt-2">Painel Admin</CardTitle>
            <CardDescription>Entre com seu e-mail e senha de administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@rotaclick.com.br"
                  className="h-12 rounded-lg border-brand-100 focus-visible:ring-brand-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-lg border-brand-100 focus-visible:ring-brand-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Entrando...</>
                ) : (
                  'Entrar no Admin'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
