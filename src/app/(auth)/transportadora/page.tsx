'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Truck, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateCarrierCNPJ } from '@/app/actions/cnpj-actions'
import { login } from '@/app/actions/auth-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'verificar'

export default function TransportadoraPage() {
  const [activeTab, setActiveTab] = useState<Tab>('verificar')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // CNPJ state
  const [cnpj, setCnpj] = useState('')
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastValidatedCnpj, setLastValidatedCnpj] = useState('')

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Preencha email e senha')
      return
    }
    setLoginLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', loginEmail)
      formData.append('password', loginPassword)
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
        setLoginLoading(false)
      }
    } catch {
      setLoginLoading(false)
    }
  }

  const handleVerifyCNPJ = async (showToast = true) => {
    const cleanCnpj = cnpj.replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
      if (showToast) toast.error('Informe o CNPJ completo')
      return
    }

    setCnpjLoading(true)
    setError(null)
    setCompanyData(null)

    try {
      const result = await validateCarrierCNPJ(cleanCnpj)
      if (result.success) {
        setCompanyData(result.data)
        setLastValidatedCnpj(cleanCnpj)
        sessionStorage.setItem('carrier_data', JSON.stringify({
          cnpj: cleanCnpj,
          razao: result.data.razao_social,
          fantasia: result.data.nome_fantasia,
          logradouro: result.data.endereco?.logradouro || result.data.logradouro,
          numero: result.data.endereco?.numero || result.data.numero,
          complemento: result.data.endereco?.complemento || '',
          bairro: result.data.endereco?.bairro || '',
          municipio: result.data.endereco?.municipio || result.data.municipio,
          uf: result.data.endereco?.uf || result.data.uf,
          cep: result.data.endereco?.cep || result.data.cep,
          cnae: result.data.cnae_principal,
          email: result.data.email || '',
          telefone: result.data.telefone || '',
          role: 'transportadora'
        }))
        if (showToast) toast.success('Empresa validada com sucesso!')
      } else {
        setError(result.error)
        setLastValidatedCnpj(cleanCnpj)
        if (showToast) toast.error(result.error)
      }
    } catch {
      if (showToast) toast.error('Erro ao conectar com o serviço de validação')
    } finally {
      setCnpjLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'verificar') return

    const cleanCnpj = cnpj.replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
      setCompanyData(null)
      setError(null)
      return
    }

    if (cnpjLoading || cleanCnpj === lastValidatedCnpj) {
      return
    }

    const timeout = setTimeout(() => {
      void handleVerifyCNPJ(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [activeTab, cnpj, cnpjLoading, lastValidatedCnpj])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="RotaClick" width={220} height={70} className="h-16 w-auto object-contain" priority />
          </div>
          <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-black text-brand-800">Área da Transportadora</h1>
          <p className="text-muted-foreground mt-1">Faça login ou cadastre sua transportadora</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-brand-50 p-1 mb-6 border border-brand-100">
          <button
            onClick={() => { setActiveTab('login'); setError(null); setCompanyData(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all',
              activeTab === 'login'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-muted-foreground hover:text-brand-600'
            )}
          >
            <LogIn className="h-4 w-4" /> Já tenho conta
          </button>
          <button
            onClick={() => { setActiveTab('verificar'); setError(null); setCompanyData(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all',
              activeTab === 'verificar'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-muted-foreground hover:text-brand-600'
            )}
          >
            <UserPlus className="h-4 w-4" /> Quero me cadastrar
          </button>
        </div>

        {/* Tab Content */}
        <Card className="border-2 border-brand-200 shadow-xl">
          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-brand-800">Entrar na sua conta</CardTitle>
                <CardDescription>Acesse o painel da sua transportadora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="focus-visible:ring-brand-500"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <Link href="/esqueci-senha" className="text-xs text-orange-500 hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10 focus-visible:ring-brand-500"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loginLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6"
                  onClick={handleLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                  {loginLoading ? 'Entrando...' : 'ENTRAR'}
                </Button>
              </CardContent>
            </>
          )}

          {/* VERIFICAR CNPJ TAB */}
          {activeTab === 'verificar' && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-brand-800">Verificar sua Transportadora</CardTitle>
                <CardDescription>Informe o CNPJ para validar sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ da Transportadora</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                      className="text-lg py-6 font-mono focus-visible:ring-brand-500"
                      disabled={cnpjLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyCNPJ()}
                    />
                    <Button
                      onClick={handleVerifyCNPJ}
                      disabled={cnpjLoading || cnpj.length < 18}
                      className="px-6 py-6 font-bold bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {cnpjLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFICAR'}
                    </Button>
                  </div>
                  {cnpj.replace(/\D/g, '').length === 14 && cnpjLoading && !companyData && !error && (
                    <p className="text-xs text-slate-500">Validando CNPJ em tempo real...</p>
                  )}
                </div>

                {/* Resultado positivo */}
                {companyData && (
                  <div className="bg-brand-50 border-2 border-brand-200 rounded-xl p-5 animate-in zoom-in duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-brand-600 mt-0.5 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <h4 className="font-bold text-brand-800">Empresa Autorizada!</h4>
                        <div className="text-sm text-brand-700 space-y-1">
                          <p><strong>Razão Social:</strong> {companyData.razao_social}</p>
                          {companyData.nome_fantasia && companyData.nome_fantasia !== companyData.razao_social && (
                            <p><strong>Nome Fantasia:</strong> {companyData.nome_fantasia}</p>
                          )}
                          <p><strong>CNAE:</strong> {companyData.cnae_principal}</p>
                          {companyData.municipio && (
                            <p><strong>Cidade:</strong> {companyData.municipio}/{companyData.uf}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => window.location.href = '/transportadora/cadastro'}
                          className="mt-3 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-5"
                        >
                          CONTINUAR PARA O CADASTRO <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultado negativo */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 animate-in zoom-in duration-300">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-900">Acesso Negado</h4>
                        <p className="text-sm text-red-800">{error}</p>
                        <p className="text-xs text-red-700 mt-2 italic">
                          O RotaClick aceita apenas empresas com CNAE de transporte rodoviário de cargas (Grupo 49.30-2).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                {!companyData && !error && (
                  <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg text-xs text-muted-foreground border border-brand-100">
                    <ShieldCheck className="h-5 w-5 text-brand-500 shrink-0" />
                    <p>
                      Sua empresa passará por uma verificação automática junto à Receita Federal para garantir a legitimidade das operações.
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>

        {/* Link para cotação */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-brand-600 hover:underline font-medium">
            ← Voltar para a cotação de frete
          </Link>
        </div>
      </div>
    </div>
  )
}
