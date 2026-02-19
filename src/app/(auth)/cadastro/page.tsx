'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signupCustomer } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Building2, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'

type PersonType = 'pf' | 'pj'

type RegisterFormState = {
  personType: PersonType
  fullName: string
  cpf: string
  cnpj: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  acceptTerms: boolean
}

const maskCPF = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)

const maskCNPJ = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18)

const maskPhone = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15)

const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)

export default function CadastroUsuarioPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<RegisterFormState>({
    personType: 'pf',
    fullName: '',
    cpf: '',
    cnpj: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    acceptTerms: false,
  })

  const setField = <K extends keyof RegisterFormState>(field: K, value: RegisterFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cpfDigits = form.cpf.replace(/\D/g, '')
    const cnpjDigits = form.cnpj.replace(/\D/g, '')

    if (form.personType === 'pf' && cpfDigits.length !== 11) {
      toast.error('Informe um CPF válido.')
      return
    }

    if (form.personType === 'pj' && cnpjDigits.length !== 14) {
      toast.error('Informe um CNPJ válido.')
      return
    }

    if (form.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (!form.acceptTerms) {
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade.')
      return
    }

    setLoading(true)

    const payload = new FormData()
    payload.append('personType', form.personType)
    payload.append('fullName', form.fullName)
    payload.append('cpf', cpfDigits)
    payload.append('cnpj', cnpjDigits)
    payload.append('phone', form.phone.replace(/\D/g, ''))
    payload.append('email', form.email.trim())
    payload.append('password', form.password)
    payload.append('cep', form.cep.replace(/\D/g, ''))
    payload.append('street', form.street)
    payload.append('number', form.number)
    payload.append('complement', form.complement)
    payload.append('neighborhood', form.neighborhood)
    payload.append('city', form.city)
    payload.append('state', form.state.toUpperCase())
    payload.append('acceptTerms', String(form.acceptTerms))

    if (next) {
      payload.append('next', next)
    }

    const result = await signupCustomer(payload)
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-[900px] flex flex-col items-center">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 bg-brand-500 rounded-lg flex items-center justify-center text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-[#11211f] text-3xl font-bold tracking-tight">RotaClick</h2>
          </div>
          <h1 className="text-[#11211f] text-3xl md:text-4xl font-extrabold leading-tight mb-2">Cadastro de Usuário</h1>
          <p className="text-[#4a5568] text-lg font-medium">Crie sua conta para acessar a plataforma de logística</p>
        </div>

        <div className="w-full bg-white rounded-xl shadow-xl p-6 md:p-10 border border-teal-50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Tipo de cadastro</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setField('personType', 'pf')}
                    className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${
                      form.personType === 'pf'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-[#dce5e4] text-[#4a5568] hover:bg-slate-50'
                    }`}
                  >
                    Pessoa Física (CPF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setField('personType', 'pj')}
                    className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${
                      form.personType === 'pj'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-[#dce5e4] text-[#4a5568] hover:bg-slate-50'
                    }`}
                  >
                    Pessoa Jurídica (CNPJ)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">
                  {form.personType === 'pf' ? 'Nome Completo' : 'Razão Social'}
                </Label>
                <div className="relative">
                  <UserRound className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="w-full h-14 pl-12 pr-4 rounded-lg border border-[#dce5e4]"
                    placeholder={form.personType === 'pf' ? 'Digite seu nome completo' : 'Digite a razão social'}
                    value={form.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">
                  {form.personType === 'pf' ? 'CPF' : 'CNPJ'}
                </Label>
                <div className="relative">
                  <ShieldCheck className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="w-full h-14 pl-12 pr-4 rounded-lg border border-[#dce5e4]"
                    placeholder={form.personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={form.personType === 'pf' ? form.cpf : form.cnpj}
                    onChange={(e) =>
                      form.personType === 'pf'
                        ? setField('cpf', maskCPF(e.target.value))
                        : setField('cnpj', maskCNPJ(e.target.value))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Telefone</Label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="w-full h-14 pl-12 pr-4 rounded-lg border border-[#dce5e4]"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setField('phone', maskPhone(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className="w-full h-14 pl-12 pr-4 rounded-lg border border-[#dce5e4]"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Senha</Label>
                <Input
                  className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Confirmar Senha</Label>
                <Input
                  className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-teal-50">
              <h3 className="text-[#11211f] text-lg font-bold mb-4">Endereço</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2 md:col-span-1">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">CEP</Label>
                    <div className="relative">
                      <MapPin className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                      <Input
                        className="w-full h-14 pl-12 pr-4 rounded-lg border border-[#dce5e4]"
                        placeholder="00000-000"
                        value={form.cep}
                        onChange={(e) => setField('cep', maskCEP(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Logradouro</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="Rua, Avenida, etc."
                      value={form.street}
                      onChange={(e) => setField('street', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Número</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="Nº"
                      value={form.number}
                      onChange={(e) => setField('number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Complemento</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="Apto, Bloco, etc."
                      value={form.complement}
                      onChange={(e) => setField('complement', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Bairro</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="Bairro"
                      value={form.neighborhood}
                      onChange={(e) => setField('neighborhood', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Cidade</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="Cidade"
                      value={form.city}
                      onChange={(e) => setField('city', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">UF</Label>
                    <Input
                      className="w-full h-14 px-4 rounded-lg border border-[#dce5e4]"
                      placeholder="UF"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => setField('state', e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2 px-1">
              <Checkbox
                id="terms"
                checked={form.acceptTerms}
                onCheckedChange={(checked) => setField('acceptTerms', checked === true)}
              />
              <Label htmlFor="terms" className="text-sm text-[#4a5568] leading-6">
                Eu aceito os{' '}
                <Link className="text-brand-600 font-semibold hover:underline" href="/termos" target="_blank">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link className="text-brand-600 font-semibold hover:underline" href="/privacidade" target="_blank">
                  Política de Privacidade
                </Link>{' '}
                da RotaClick.
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-lg"
              disabled={loading}
            >
              {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link className="text-brand-600 font-bold hover:text-brand-700 transition-colors" href="/login">
              Voltar para login
            </Link>
            <Link className="text-orange-500 font-semibold hover:underline" href="/registro-transportadora">
              Sou transportadora
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
