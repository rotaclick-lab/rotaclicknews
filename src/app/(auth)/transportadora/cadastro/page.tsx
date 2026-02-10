'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Truck, Building2, User, Phone, MapPin, FileText, Lock, 
  CheckCircle2, ChevronRight, ChevronLeft, Loader2, Eye, EyeOff 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signup } from '@/app/actions/auth-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BRAZILIAN_STATES } from '@/lib/constants'

interface CarrierData {
  cnpj: string
  razao: string
  fantasia: string
  logradouro?: string
  numero?: string
  municipio?: string
  uf?: string
  cep?: string
  cnae?: string
}

export default function CadastroTransportadoraPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [carrierData, setCarrierData] = useState<CarrierData | null>(null)

  // Dados da Empresa (preenchidos via CNPJ)
  const [empresa, setEmpresa] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    cnae: '',
  })

  // Endereço
  const [endereco, setEndereco] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  // Responsável
  const [responsavel, setResponsavel] = useState({
    nomeCompleto: '',
    cpf: '',
    cargo: '',
    email: '',
    telefone: '',
    celular: '',
  })

  // Acesso
  const [acesso, setAcesso] = useState({
    email: '',
    senha: '',
    confirmarSenha: '',
    aceitaTermos: false,
  })

  // Máscaras
  const maskCNPJ = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const maskCPF = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const maskPhone = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCelular = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCEP = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  // Carregar dados do sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('carrier_data')
      if (savedData) {
        try {
          const data = JSON.parse(savedData) as CarrierData
          setCarrierData(data)
          setEmpresa({
            cnpj: maskCNPJ(data.cnpj || ''),
            razaoSocial: data.razao || '',
            nomeFantasia: data.fantasia || '',
            inscricaoEstadual: '',
            cnae: data.cnae || '',
          })
          setEndereco(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
            cep: data.cep ? maskCEP(data.cep) : '',
          }))
        } catch (e) {
          console.error('Erro ao ler dados da transportadora', e)
        }
      } else {
        // Se não tem dados, redirecionar para verificação
        router.push('/transportadora')
      }
    }
  }, [router])

  // Buscar CEP
  const handleCEPChange = async (value: string) => {
    const masked = maskCEP(value)
    setEndereco(prev => ({ ...prev, cep: masked }))
    
    const clean = value.replace(/\D/g, '')
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setEndereco(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }))
        }
      } catch {}
    }
  }

  // Validações por step
  const isStep1Valid = empresa.cnpj && empresa.razaoSocial && empresa.nomeFantasia
  const isStep2Valid = endereco.cep && endereco.logradouro && endereco.numero && endereco.cidade && endereco.estado
  const isStep3Valid = responsavel.nomeCompleto && responsavel.cpf.replace(/\D/g, '').length === 11 && responsavel.email && responsavel.celular
  const isStep4Valid = acesso.email && acesso.senha.length >= 8 && acesso.senha === acesso.confirmarSenha && acesso.aceitaTermos

  const handleSubmit = async () => {
    if (!isStep4Valid) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', acesso.email)
      formData.append('password', acesso.senha)
      formData.append('fullName', responsavel.nomeCompleto)
      formData.append('companyName', empresa.nomeFantasia || empresa.razaoSocial)
      formData.append('cnpj', empresa.cnpj.replace(/\D/g, ''))

      const result = await signup(formData)

      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      } else {
        // Limpar sessionStorage
        sessionStorage.removeItem('carrier_data')
        toast.success('Conta criada com sucesso!')
      }
    } catch {
      toast.error('Erro ao criar conta')
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, label: 'Empresa', icon: Building2 },
    { num: 2, label: 'Endereço', icon: MapPin },
    { num: 3, label: 'Responsável', icon: User },
    { num: 4, label: 'Acesso', icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 py-8 px-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="RotaClick" width={160} height={80} priority />
          </div>
          <h1 className="text-2xl font-black text-brand-800">Cadastro da Transportadora</h1>
          <p className="text-muted-foreground mt-1 text-sm">Preencha todos os dados para completar seu cadastro</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-between mb-8 relative px-4">
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 z-0" />
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                    step >= s.num
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  'text-xs mt-2 font-medium',
                  step >= s.num ? 'text-brand-700' : 'text-muted-foreground'
                )}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Step 1: Dados da Empresa */}
        {step === 1 && (
          <Card className="border-2 border-brand-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-800">
                <Building2 className="h-5 w-5 text-brand-500" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>Informações preenchidas automaticamente pela verificação do CNPJ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>CNPJ</Label>
                  <Input value={empresa.cnpj} disabled className="bg-brand-50 font-mono text-lg" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Razão Social</Label>
                  <Input value={empresa.razaoSocial} disabled className="bg-brand-50" />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia <span className="text-red-500">*</span></Label>
                  <Input
                    value={empresa.nomeFantasia}
                    onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Nome comercial da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={empresa.inscricaoEstadual}
                    onChange={(e) => setEmpresa({ ...empresa, inscricaoEstadual: e.target.value.replace(/\D/g, '') })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Número da IE"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>CNAE Principal</Label>
                  <Input value={empresa.cnae} disabled className="bg-brand-50 text-sm" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Endereço */}
        {step === 2 && (
          <Card className="border-2 border-brand-200 shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-800">
                <MapPin className="h-5 w-5 text-orange-500" />
                Endereço da Empresa
              </CardTitle>
              <CardDescription>Endereço da sede ou filial principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP <span className="text-red-500">*</span></Label>
                  <Input
                    value={endereco.cep}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    className="focus-visible:ring-brand-500"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro <span className="text-red-500">*</span></Label>
                  <Input
                    value={endereco.logradouro}
                    onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número <span className="text-red-500">*</span></Label>
                  <Input
                    value={endereco.numero}
                    onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Nº"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={endereco.complemento}
                    onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Sala, Andar..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={endereco.bairro}
                    onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade <span className="text-red-500">*</span></Label>
                  <Input
                    value={endereco.cidade}
                    onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado <span className="text-red-500">*</span></Label>
                  <select
                    value={endereco.estado}
                    onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {BRAZILIAN_STATES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="border-brand-200 text-brand-700 hover:bg-brand-50">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Responsável */}
        {step === 3 && (
          <Card className="border-2 border-brand-200 shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-800">
                <User className="h-5 w-5 text-brand-500" />
                Dados do Responsável
              </CardTitle>
              <CardDescription>Informações do responsável legal pela transportadora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome Completo <span className="text-red-500">*</span></Label>
                  <Input
                    value={responsavel.nomeCompleto}
                    onChange={(e) => setResponsavel({ ...responsavel, nomeCompleto: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="Nome completo do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF <span className="text-red-500">*</span></Label>
                  <Input
                    value={responsavel.cpf}
                    onChange={(e) => setResponsavel({ ...responsavel, cpf: maskCPF(e.target.value) })}
                    className="focus-visible:ring-brand-500"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo na Empresa</Label>
                  <select
                    value={responsavel.cargo}
                    onChange={(e) => setResponsavel({ ...responsavel, cargo: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="proprietario">Proprietário / Sócio</option>
                    <option value="diretor">Diretor</option>
                    <option value="gerente">Gerente de Operações</option>
                    <option value="coordenador">Coordenador de Logística</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Email do Responsável <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={responsavel.email}
                    onChange={(e) => setResponsavel({ ...responsavel, email: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="responsavel@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone Fixo</Label>
                  <Input
                    value={responsavel.telefone}
                    onChange={(e) => setResponsavel({ ...responsavel, telefone: maskPhone(e.target.value) })}
                    className="focus-visible:ring-brand-500"
                    placeholder="(00) 0000-0000"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Celular / WhatsApp <span className="text-red-500">*</span></Label>
                  <Input
                    value={responsavel.celular}
                    onChange={(e) => setResponsavel({ ...responsavel, celular: maskCelular(e.target.value) })}
                    className="focus-visible:ring-brand-500"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="border-brand-200 text-brand-700 hover:bg-brand-50">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                  onClick={() => { setStep(4); if (!acesso.email) setAcesso(prev => ({ ...prev, email: responsavel.email })) }}
                  disabled={!isStep3Valid}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Acesso */}
        {step === 4 && (
          <Card className="border-2 border-brand-200 shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-800">
                <Lock className="h-5 w-5 text-orange-500" />
                Dados de Acesso
              </CardTitle>
              <CardDescription>Crie suas credenciais para acessar o painel da transportadora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email de Acesso <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={acesso.email}
                    onChange={(e) => setAcesso({ ...acesso, email: e.target.value })}
                    className="focus-visible:ring-brand-500"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={acesso.senha}
                      onChange={(e) => setAcesso({ ...acesso, senha: e.target.value })}
                      className="pr-10 focus-visible:ring-brand-500"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength indicators */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className={cn('h-1 rounded-full', acesso.senha.length >= 8 ? 'bg-brand-500' : 'bg-gray-200')} />
                    <div className={cn('h-1 rounded-full', /[A-Z]/.test(acesso.senha) ? 'bg-brand-500' : 'bg-gray-200')} />
                    <div className={cn('h-1 rounded-full', /[0-9]/.test(acesso.senha) ? 'bg-brand-500' : 'bg-gray-200')} />
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span className={acesso.senha.length >= 8 ? 'text-brand-600 font-bold' : ''}>8+ caracteres</span>
                    <span className={/[A-Z]/.test(acesso.senha) ? 'text-brand-600 font-bold' : ''}>1 maiúscula</span>
                    <span className={/[0-9]/.test(acesso.senha) ? 'text-brand-600 font-bold' : ''}>1 número</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={acesso.confirmarSenha}
                      onChange={(e) => setAcesso({ ...acesso, confirmarSenha: e.target.value })}
                      className={cn(
                        'pr-10 focus-visible:ring-brand-500',
                        acesso.confirmarSenha && acesso.senha !== acesso.confirmarSenha && 'border-red-300 focus-visible:ring-red-500'
                      )}
                      placeholder="Repita a senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {acesso.confirmarSenha && acesso.senha !== acesso.confirmarSenha && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acesso.aceitaTermos}
                    onCheckedChange={(checked) => setAcesso({ ...acesso, aceitaTermos: checked as boolean })}
                    className="data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500 mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    Aceito os{' '}
                    <Link href="/termos" className="text-brand-600 hover:underline">termos de uso</Link>{' '}
                    e{' '}
                    <Link href="/privacidade" className="text-brand-600 hover:underline">política de privacidade</Link>{' '}
                    do RotaClick
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)} className="border-brand-200 text-brand-700 hover:bg-brand-50">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
                  onClick={handleSubmit}
                  disabled={loading || !isStep4Valid}
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Criando conta...</>
                  ) : (
                    <><CheckCircle2 className="h-5 w-5 mr-2" /> FINALIZAR CADASTRO</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Link voltar */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/transportadora" className="text-brand-600 hover:underline font-medium">
            ← Voltar para a área da transportadora
          </Link>
        </div>
      </div>
    </div>
  )
}
