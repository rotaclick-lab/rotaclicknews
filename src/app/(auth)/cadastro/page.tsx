'use client'

import { useRef, useState } from 'react'
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

type RegisterFormErrors = {
  cpf?: string
  cnpj?: string
  phone?: string
  email?: string
  cep?: string
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidCPF = (value: string) => {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  return remainder === Number(cpf[10])
}

const isValidCNPJ = (value: string) => {
  const cnpj = value.replace(/\D/g, '')
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const calcDigit = (base: string, factors: number[]) => {
    const total = base.split('').reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const digit1 = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const digit2 = calcDigit(cnpj.slice(0, 12) + String(digit1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return cnpj.endsWith(`${digit1}${digit2}`)
}

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
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [cepLoading, setCepLoading] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const lastCepLookup = useRef('')
  const cepRequestId = useRef(0)

  const setField = <K extends keyof RegisterFormState>(field: K, value: RegisterFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const setFieldError = (field: keyof RegisterFormErrors, message?: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }

  const getInputStateClass = (error?: string) =>
    error ? 'border-red-400 focus-visible:ring-red-500' : 'border-brand-100 focus-visible:ring-brand-500'

  const validateCPFField = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setFieldError('cpf', 'CPF é obrigatório.')
      return false
    }
    if (digits.length < 11) {
      setFieldError('cpf', 'CPF incompleto.')
      return false
    }
    if (!isValidCPF(value)) {
      setFieldError('cpf', 'CPF inválido.')
      return false
    }
    setFieldError('cpf', undefined)
    return true
  }

  const validateCNPJField = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setFieldError('cnpj', 'CNPJ é obrigatório.')
      return false
    }
    if (digits.length < 14) {
      setFieldError('cnpj', 'CNPJ incompleto.')
      return false
    }
    if (!isValidCNPJ(value)) {
      setFieldError('cnpj', 'CNPJ inválido.')
      return false
    }
    setFieldError('cnpj', undefined)
    return true
  }

  const validatePhoneField = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setFieldError('phone', 'Telefone é obrigatório.')
      return false
    }
    if (digits.length < 10) {
      setFieldError('phone', 'Telefone incompleto.')
      return false
    }
    if (digits.length > 11) {
      setFieldError('phone', 'Telefone inválido.')
      return false
    }
    setFieldError('phone', undefined)
    return true
  }

  const validateEmailField = (value: string) => {
    const email = value.trim()
    if (!email) {
      setFieldError('email', 'E-mail é obrigatório.')
      return false
    }
    if (!emailRegex.test(email)) {
      setFieldError('email', 'E-mail inválido.')
      return false
    }
    setFieldError('email', undefined)
    return true
  }

  const handlePersonTypeChange = (personType: PersonType) => {
    setField('personType', personType)
    setErrors((prev) => ({ ...prev, cpf: undefined, cnpj: undefined }))

    if (personType === 'pf' && form.cpf) {
      validateCPFField(form.cpf)
    }

    if (personType === 'pj' && form.cnpj) {
      validateCNPJField(form.cnpj)
    }
  }

  const handleDocumentChange = (value: string) => {
    if (form.personType === 'pf') {
      const maskedCPF = maskCPF(value)
      setField('cpf', maskedCPF)
      validateCPFField(maskedCPF)
      return
    }

    const maskedCNPJ = maskCNPJ(value)
    setField('cnpj', maskedCNPJ)
    validateCNPJField(maskedCNPJ)
  }

  const handlePhoneChange = (value: string) => {
    const maskedPhone = maskPhone(value)
    setField('phone', maskedPhone)
    validatePhoneField(maskedPhone)
  }

  const handleEmailChange = (value: string) => {
    setField('email', value)
    validateEmailField(value)
  }

  const handleCEPChange = async (value: string) => {
    const maskedCEP = maskCEP(value)
    const cepDigits = maskedCEP.replace(/\D/g, '')
    setField('cep', maskedCEP)
    setCepMessage(null)

    if (!cepDigits) {
      cepRequestId.current += 1
      setFieldError('cep', 'CEP é obrigatório.')
      setCepLoading(false)
      lastCepLookup.current = ''
      return
    }

    if (cepDigits.length < 8) {
      cepRequestId.current += 1
      setFieldError('cep', 'CEP incompleto.')
      setCepLoading(false)
      lastCepLookup.current = ''
      return
    }

    setFieldError('cep', undefined)

    if (cepDigits === lastCepLookup.current) {
      return
    }

    const requestId = ++cepRequestId.current
    setCepLoading(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        headers: {
          Accept: 'application/json',
        },
      })

      const data = await response.json()

      if (requestId !== cepRequestId.current) {
        return
      }

      if (!response.ok || data.erro) {
        setFieldError('cep', 'CEP não encontrado.')
        setCepMessage(null)
        return
      }

      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: (data.uf || prev.state || '').toUpperCase(),
        complement: prev.complement || data.complemento || '',
      }))

      setFieldError('cep', undefined)
      setCepMessage('Endereço preenchido automaticamente.')
      lastCepLookup.current = cepDigits
    } catch {
      if (requestId !== cepRequestId.current) {
        return
      }

      setFieldError('cep', 'Não foi possível consultar o CEP.')
      setCepMessage(null)
    } finally {
      if (requestId === cepRequestId.current) {
        setCepLoading(false)
      }
    }
  }

  const validateFormBeforeSubmit = () => {
    const nextErrors: RegisterFormErrors = {}

    const cpfDigits = form.cpf.replace(/\D/g, '')
    const cnpjDigits = form.cnpj.replace(/\D/g, '')
    const phoneDigits = form.phone.replace(/\D/g, '')
    const trimmedEmail = form.email.trim()
    const cepDigits = form.cep.replace(/\D/g, '')

    if (form.personType === 'pf') {
      if (!cpfDigits) {
        nextErrors.cpf = 'CPF é obrigatório.'
      } else if (cpfDigits.length !== 11 || !isValidCPF(form.cpf)) {
        nextErrors.cpf = 'CPF inválido.'
      }
    }

    if (form.personType === 'pj') {
      if (!cnpjDigits) {
        nextErrors.cnpj = 'CNPJ é obrigatório.'
      } else if (cnpjDigits.length !== 14 || !isValidCNPJ(form.cnpj)) {
        nextErrors.cnpj = 'CNPJ inválido.'
      }
    }

    if (!phoneDigits) {
      nextErrors.phone = 'Telefone é obrigatório.'
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      nextErrors.phone = 'Telefone inválido.'
    }

    if (!trimmedEmail) {
      nextErrors.email = 'E-mail é obrigatório.'
    } else if (!emailRegex.test(trimmedEmail)) {
      nextErrors.email = 'E-mail inválido.'
    }

    if (!cepDigits) {
      nextErrors.cep = 'CEP é obrigatório.'
    } else if (cepDigits.length !== 8) {
      nextErrors.cep = 'CEP inválido.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateFormBeforeSubmit()) {
      toast.error('Revise os campos obrigatórios destacados.')
      return
    }

    const cpfDigits = form.cpf.replace(/\D/g, '')
    const cnpjDigits = form.cnpj.replace(/\D/g, '')

    if (form.personType === 'pf' && (cpfDigits.length !== 11 || !isValidCPF(form.cpf))) {
      toast.error('Informe um CPF válido.')
      return
    }

    if (form.personType === 'pj' && (cnpjDigits.length !== 14 || !isValidCNPJ(form.cnpj))) {
      toast.error('Informe um CNPJ válido.')
      return
    }

    if (!validatePhoneField(form.phone)) {
      toast.error('Informe um telefone válido.')
      return
    }

    if (!validateEmailField(form.email)) {
      toast.error('Informe um e-mail válido.')
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
      <div className="mx-auto w-full max-w-[900px] flex flex-col items-center">
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

        <div className="w-full rounded-2xl border border-brand-100 bg-white/95 p-6 shadow-xl shadow-brand-200/30 backdrop-blur-sm md:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Tipo de cadastro</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => handlePersonTypeChange('pf')}
                    className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${
                      form.personType === 'pf'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-brand-100 text-[#4a5568] hover:bg-slate-50'
                    }`}
                  >
                    Pessoa Física (CPF)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonTypeChange('pj')}
                    className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${
                      form.personType === 'pj'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-brand-100 text-[#4a5568] hover:bg-slate-50'
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
                    className="w-full h-14 rounded-lg border border-brand-100 pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                    className={`w-full h-14 rounded-lg border pl-12 pr-4 focus-visible:ring-2 ${getInputStateClass(
                      form.personType === 'pf' ? errors.cpf : errors.cnpj
                    )}`}
                    placeholder={form.personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={form.personType === 'pf' ? form.cpf : form.cnpj}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    required
                  />
                </div>
                {form.personType === 'pf' && errors.cpf && <p className="ml-1 text-sm text-red-500">{errors.cpf}</p>}
                {form.personType === 'pj' && errors.cnpj && <p className="ml-1 text-sm text-red-500">{errors.cnpj}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Telefone</Label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className={`w-full h-14 rounded-lg border pl-12 pr-4 focus-visible:ring-2 ${getInputStateClass(
                      errors.phone
                    )}`}
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                  />
                </div>
                {errors.phone && <p className="ml-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                  <Input
                    className={`w-full h-14 rounded-lg border pl-12 pr-4 focus-visible:ring-2 ${getInputStateClass(
                      errors.email
                    )}`}
                    type="email"
                    placeholder="exemplo@email.com"
                    value={form.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                  />
                </div>
                {errors.email && <p className="ml-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[#11211f] text-sm font-semibold ml-1">Senha</Label>
                <Input
                  className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                  className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-brand-100">
              <h3 className="text-[#11211f] text-lg font-bold mb-4">Endereço</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2 md:col-span-1">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">CEP</Label>
                    <div className="relative">
                      <MapPin className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
                      <Input
                        className={`w-full h-14 rounded-lg border pl-12 pr-4 focus-visible:ring-2 ${getInputStateClass(
                          errors.cep
                        )}`}
                        placeholder="00000-000"
                        value={form.cep}
                        onChange={(e) => {
                          void handleCEPChange(e.target.value)
                        }}
                        required
                      />
                    </div>
                    {errors.cep && <p className="ml-1 text-sm text-red-500">{errors.cep}</p>}
                    {!errors.cep && cepLoading && <p className="ml-1 text-sm text-brand-600">Buscando CEP...</p>}
                    {!errors.cep && !cepLoading && cepMessage && <p className="ml-1 text-sm text-brand-600">{cepMessage}</p>}
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Logradouro</Label>
                    <Input
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
                      placeholder="Nº"
                      value={form.number}
                      onChange={(e) => setField('number', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Complemento</Label>
                    <Input
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
                      placeholder="Apto, Bloco, etc."
                      value={form.complement}
                      onChange={(e) => setField('complement', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Bairro</Label>
                    <Input
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
                      placeholder="Bairro"
                      value={form.neighborhood}
                      onChange={(e) => setField('neighborhood', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[#11211f] text-sm font-semibold ml-1">Cidade</Label>
                    <Input
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                      className="w-full h-14 rounded-lg border border-brand-100 px-4 focus-visible:ring-2 focus-visible:ring-brand-500"
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
            <Link className="text-brand-600 font-semibold hover:underline" href="/transportadora">
              Sou transportadora
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
