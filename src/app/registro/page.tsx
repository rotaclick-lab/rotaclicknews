'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { registerCarrier } from '@/app/actions/carrier-register-actions'
import { toast } from 'sonner'

// ===== MASKS =====
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
const maskCNPJ = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')
const maskIE = (v: string) => v.replace(/[^0-9./-]/g, '')

// ===== VALIDATORS =====
function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]!) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== parseInt(clean[9]!)) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]!) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  return rest === parseInt(clean[10]!)
}

function validateIE(ie: string, uf: string): boolean {
  const clean = ie.replace(/\D/g, '')
  if (clean.length === 0) return false
  if (uf === 'SP' && clean.length !== 12) return false
  if (uf === 'MG' && clean.length !== 13) return false
  if (uf === 'RJ' && clean.length !== 8) return false
  if (uf === 'PR' && clean.length !== 10) return false
  if (uf === 'RS' && clean.length !== 10) return false
  if (uf === 'SC' && clean.length !== 9) return false
  if (uf === 'BA' && (clean.length < 8 || clean.length > 9)) return false
  // Para outros estados, aceitar entre 7 e 14 dígitos
  if (clean.length < 7 || clean.length > 14) return false
  return true
}

// ===== TYPES =====
interface FormData {
  // Step 1
  nomeCompleto: string
  cpf: string
  telefone: string
  razaoSocial: string
  cnpj: string
  logoFile: File | null
  inscricaoEstadual: string
  rntrc: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  // Step 2
  tipoVeiculo: string
  tipoCarroceria: string
  capacidadeCarga: string
  raioOperacao: string
  regioes: string[]
  consumoMedio: string
  qtdEixos: string
  numeroApolice: string
  possuiRastreamento: boolean
  possuiSeguro: boolean
  // Step 3
  email: string
  senha: string
  confirmarSenha: string
  apoliceSeguroFile: File | null
  aceitaTermos: boolean
  aceitaPrivacidade: boolean
  aceitaComunicacoes: boolean
  aceitaAnalise: boolean
}

interface FieldErrors {
  cpf?: string | undefined
  cep?: string | undefined
  inscricaoEstadual?: string | undefined
  email?: string | undefined
  senha?: string | undefined
  confirmarSenha?: string | undefined
}

const UF_OPTIONS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [cepLoading, setCepLoading] = useState(false)
  const [cepValid, setCepValid] = useState<boolean | null>(null)
  const [form, setForm] = useState<FormData>({
    nomeCompleto: '', cpf: '', telefone: '',
    razaoSocial: '', cnpj: '', logoFile: null, inscricaoEstadual: '', rntrc: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    tipoVeiculo: '', tipoCarroceria: '', capacidadeCarga: '', raioOperacao: '',
    regioes: [], consumoMedio: '', qtdEixos: '', numeroApolice: '',
    possuiRastreamento: true, possuiSeguro: false,
    email: '', senha: '', confirmarSenha: '',
    apoliceSeguroFile: null,
    aceitaTermos: false, aceitaPrivacidade: false, aceitaComunicacoes: false, aceitaAnalise: false,
  })

  // ===== AUTO-FILL FROM CNPJ DATA =====
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('carrier_data')
      if (stored) {
        const data = JSON.parse(stored)
        const address = data.endereco || {}
        const razaoSocial =
          data.razao ||
          data.razao_social ||
          data.fantasia ||
          data.nome_fantasia ||
          ''
        const logradouro = data.logradouro || address.logradouro || ''
        const numero = data.numero || address.numero || ''
        const complemento = data.complemento || address.complemento || ''
        const bairro = data.bairro || address.bairro || ''
        const cidade = data.municipio || data.cidade || address.municipio || address.cidade || ''
        const uf = data.uf || address.uf || ''
        const cepRaw = data.cep || address.cep || ''
        const telefone = data.telefone || ''

        setForm(prev => ({
          ...prev,
          cnpj: data.cnpj ? maskCNPJ(data.cnpj) : prev.cnpj,
          razaoSocial: razaoSocial || prev.razaoSocial,
          logradouro: logradouro || prev.logradouro,
          numero: numero || prev.numero,
          complemento: complemento || prev.complemento,
          cidade: cidade || prev.cidade,
          uf: uf || prev.uf,
          cep: cepRaw ? maskCEP(String(cepRaw).replace(/\D/g, '')) : prev.cep,
          bairro: bairro || prev.bairro,
          email: data.email || prev.email,
          telefone: telefone ? maskPhone(String(telefone)) : prev.telefone,
        }))
        // Se tem CEP, marcar como válido
        if (String(cepRaw).replace(/\D/g, '').length === 8) {
          setCepValid(true)
        }
      }
    } catch {}
  }, [])

  const set = useCallback((field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao editar
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const toggleRegiao = (regiao: string) => {
    setForm(prev => ({
      ...prev,
      regioes: prev.regioes.includes(regiao)
        ? prev.regioes.filter(r => r !== regiao)
        : [...prev.regioes, regiao]
    }))
  }

  const handleApoliceFileChange = (file: File | null) => {
    if (!file) {
      set('apoliceSeguroFile', null)
      return
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido. Envie PDF, PNG ou JPG.')
      return
    }

    const maxSizeBytes = 10 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB.')
      return
    }

    set('apoliceSeguroFile', file)
  }

  // ===== REAL-TIME CPF VALIDATION =====
  const handleCPFChange = (value: string) => {
    const masked = maskCPF(value)
    set('cpf', masked)
    const clean = masked.replace(/\D/g, '')
    if (clean.length === 11) {
      if (!validateCPF(masked)) {
        setErrors(prev => ({ ...prev, cpf: 'CPF inválido. Verifique os dígitos.' }))
      } else {
        setErrors(prev => ({ ...prev, cpf: undefined }))
      }
    } else if (clean.length > 0 && clean.length < 11) {
      setErrors(prev => ({ ...prev, cpf: undefined }))
    }
  }

  // ===== REAL-TIME CEP VALIDATION + LOOKUP =====
  const handleCEPChange = async (value: string) => {
    const masked = maskCEP(value)
    set('cep', masked)
    const clean = masked.replace(/\D/g, '')
    
    if (clean.length === 8) {
      setCepLoading(true)
      setCepValid(null)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            cep: masked,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf,
          }))
          setCepValid(true)
          setErrors(prev => ({ ...prev, cep: undefined }))
        } else {
          setCepValid(false)
          setErrors(prev => ({ ...prev, cep: 'CEP não encontrado.' }))
        }
      } catch {
        setCepValid(false)
        setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP. Tente novamente.' }))
      } finally {
        setCepLoading(false)
      }
    } else {
      setCepValid(null)
      setErrors(prev => ({ ...prev, cep: undefined }))
    }
  }

  // ===== REAL-TIME IE VALIDATION =====
  const handleIEChange = (value: string) => {
    const masked = maskIE(value)
    set('inscricaoEstadual', masked)
    const clean = masked.replace(/\D/g, '')
    if (clean.length >= 7) {
      const uf = form.uf || 'SP'
      if (!validateIE(masked, uf)) {
        setErrors(prev => ({ ...prev, inscricaoEstadual: `Inscrição Estadual inválida para ${uf}.` }))
      } else {
        setErrors(prev => ({ ...prev, inscricaoEstadual: undefined }))
      }
    } else {
      setErrors(prev => ({ ...prev, inscricaoEstadual: undefined }))
    }
  }

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return Math.min(score, 4)
  }

  const strengthLabels = ['', 'Fraca', 'Razoável', 'Forte', 'Muito Forte']
  const strength = getPasswordStrength(form.senha)

  // ===== STEP 1 VALIDATION =====
  const validateStep1 = (): boolean => {
    const newErrors: FieldErrors = {}
    const cpfClean = form.cpf.replace(/\D/g, '')
    if (cpfClean.length === 11 && !validateCPF(form.cpf)) {
      newErrors.cpf = 'CPF inválido. Verifique os dígitos.'
    }
    if (cpfClean.length > 0 && cpfClean.length < 11) {
      newErrors.cpf = 'CPF incompleto.'
    }
    const cepClean = form.cep.replace(/\D/g, '')
    if (cepClean.length > 0 && cepClean.length < 8) {
      newErrors.cep = 'CEP incompleto.'
    }
    if (cepValid === false) {
      newErrors.cep = 'CEP não encontrado.'
    }
    const ieClean = form.inscricaoEstadual.replace(/\D/g, '')
    if (ieClean.length > 0 && !validateIE(form.inscricaoEstadual, form.uf || 'SP')) {
      newErrors.inscricaoEstadual = `Inscrição Estadual inválida para ${form.uf || 'SP'}.`
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep1 = () => {
    if (validateStep1()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    // Validar campos obrigatórios do Step 3
    if (!form.email) {
      toast.error('Preencha o email de acesso')
      return
    }
    if (!form.senha || form.senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    if (!form.aceitaTermos || !form.aceitaPrivacidade) {
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade')
      return
    }

    setLoading(true)
    try {
      let logoBase64: string | undefined
      if (form.logoFile) {
        const reader = new FileReader()
        logoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(form.logoFile!)
        })
      }

      const result = await registerCarrier({
        // Responsável
        nomeCompleto: form.nomeCompleto,
        cpf: form.cpf,
        telefone: form.telefone,
        // Empresa
        razaoSocial: form.razaoSocial,
        cnpj: form.cnpj,
        logoBase64,
        inscricaoEstadual: form.inscricaoEstadual,
        rntrc: form.rntrc,
        // Endereço
        cep: form.cep,
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        // Operacional
        tipoVeiculo: form.tipoVeiculo,
        tipoCarroceria: form.tipoCarroceria,
        capacidadeCarga: form.capacidadeCarga,
        raioOperacao: form.raioOperacao,
        regioes: form.regioes,
        consumoMedio: form.consumoMedio,
        qtdEixos: form.qtdEixos,
        numeroApolice: form.numeroApolice,
        possuiRastreamento: form.possuiRastreamento,
        possuiSeguro: form.possuiSeguro,
        // Credenciais
        email: form.email,
        senha: form.senha,
        // Termos
        aceitaTermos: form.aceitaTermos,
        aceitaPrivacidade: form.aceitaPrivacidade,
        aceitaComunicacoes: form.aceitaComunicacoes,
        aceitaAnalise: form.aceitaAnalise,
      })

      if (result.success) {
        toast.success('Cadastro realizado com sucesso!')
        // Limpar sessionStorage
        sessionStorage.removeItem('carrier_data')
        // Redirecionar para página de sucesso
        router.push(next ? `/registro/sucesso?next=${encodeURIComponent(next)}` : '/registro/sucesso')
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ===== HELPER: Input with validation =====
  const inputClass = (field?: string) => {
    const hasError = field && errors[field as keyof FieldErrors]
    return `w-full h-[56px] px-4 rounded-lg border ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5]'} bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all`
  }

  const errorMessage = (field: keyof FieldErrors) => {
    if (!errors[field]) return null
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="material-icons-round text-red-500 text-sm">error</span>
        <span className="text-xs font-medium text-red-500">{errors[field]}</span>
      </div>
    )
  }

  const successIndicator = (valid: boolean | null) => {
    if (valid === null) return null
    if (valid) return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="material-icons-round text-emerald-500 text-sm">check_circle</span>
        <span className="text-xs font-medium text-emerald-500">Validado com sucesso</span>
      </div>
    )
    return null
  }

  // ===== STEP 1 =====
  if (step === 1) {
    return (
      <div className="min-h-screen font-display text-slate-800 antialiased" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="RotaClick" width={220} height={70} priority />
            </div>
            <h1 className="text-[48px] font-extrabold leading-tight text-slate-900 mb-4">Cadastro de Transportadora</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Preencha as informações básicas para começar a operar na plataforma e conectar-se com novas oportunidades de frete.
            </p>
          </header>

          {/* Navigation Tabs */}
          <nav className="flex gap-4 mb-10">
            <div className="flex-1 h-[64px] flex items-center justify-center gap-3 bg-[#13b9a5] text-white rounded-lg shadow-lg shadow-[#13b9a5]/20 cursor-default">
              <span className="material-icons-round">person</span>
              <span className="font-bold">Dados Pessoais</span>
            </div>
            <div className="flex-1 h-[64px] flex items-center justify-center gap-3 bg-slate-200/50 text-slate-500 rounded-lg cursor-not-allowed">
              <span className="material-icons-round">vpn_key</span>
              <span className="font-bold">Credenciais</span>
            </div>
          </nav>

          {/* Form Container */}
          <main className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-white/40">
            <div className="space-y-12">
              {/* Section 1: Dados do Responsável */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <span className="material-icons-round text-[#13b9a5]">account_circle</span>
                  <h2 className="text-xl font-bold text-slate-800">Dados do Responsável</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Nome Completo</label>
                    <input
                      className={inputClass()}
                      placeholder="Ex: João Silva"
                      value={form.nomeCompleto}
                      onChange={e => set('nomeCompleto', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[18px] font-medium text-slate-700 mb-2">CPF <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <input
                          className={inputClass('cpf')}
                          placeholder="000.000.000-00"
                          value={form.cpf}
                          onChange={e => handleCPFChange(e.target.value)}
                          maxLength={14}
                        />
                        {form.cpf.replace(/\D/g, '').length === 11 && !errors.cpf && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons-round text-emerald-500">check_circle</span>
                        )}
                      </div>
                      {errorMessage('cpf')}
                      {form.cpf.replace(/\D/g, '').length === 11 && !errors.cpf && successIndicator(true)}
                    </div>
                    <div>
                      <label className="block text-[18px] font-medium text-slate-700 mb-2">Telefone</label>
                      <input
                        className={inputClass()}
                        placeholder="(00) 00000-0000"
                        value={form.telefone}
                        onChange={e => set('telefone', maskPhone(e.target.value))}
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Dados da Empresa */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <span className="material-icons-round text-[#13b9a5]">business</span>
                  <h2 className="text-xl font-bold text-slate-800">Dados da Empresa</h2>
                  {form.cnpj && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      <span className="material-icons-round text-sm">verified</span>
                      Dados preenchidos via CNPJ
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Razão Social</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none transition-all"
                      placeholder="Nome da sua transportadora"
                      value={form.razaoSocial}
                      onChange={e => set('razaoSocial', e.target.value)}
                      readOnly={!!form.razaoSocial && form.cnpj !== ''}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">CNPJ</label>
                    <div className="relative">
                      <input
                        className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed italic outline-none"
                        disabled
                        value={form.cnpj || ''}
                      />
                      {form.cnpj && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons-round text-emerald-500">verified</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Inscrição Estadual <span className="text-red-400">*</span></label>
                    <input
                      className={inputClass('inscricaoEstadual')}
                      placeholder={`Ex: ${form.uf === 'SP' ? '123.456.789.012' : form.uf === 'MG' ? '1234567890123' : '123456789'}`}
                      value={form.inscricaoEstadual}
                      onChange={e => handleIEChange(e.target.value)}
                    />
                    {errorMessage('inscricaoEstadual')}
                    {form.inscricaoEstadual.replace(/\D/g, '').length >= 7 && !errors.inscricaoEstadual && successIndicator(true)}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">RNTRC</label>
                    <input
                      className={inputClass()}
                      placeholder="Registro na ANTT"
                      value={form.rntrc}
                      onChange={e => set('rntrc', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Logotipo da transportadora</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                          {form.logoFile ? (
                            <img src={URL.createObjectURL(form.logoFile)} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="material-icons-round text-slate-400 text-3xl">image</span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f && f.size <= 2 * 1024 * 1024) setForm(prev => ({ ...prev, logoFile: f }))
                            else if (f) toast.error('O logo deve ter no máximo 2MB')
                          }}
                        />
                        <span className="text-sm text-slate-600">Clique para enviar. JPG, PNG ou WebP. Máx. 2MB.</span>
                      </label>
                      {form.logoFile && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, logoFile: null }))}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Endereço */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <span className="material-icons-round text-[#13b9a5]">place</span>
                  <h2 className="text-xl font-bold text-slate-800">Endereço</h2>
                  {form.cep && cepValid && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      <span className="material-icons-round text-sm">verified</span>
                      Endereço preenchido via CEP
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">CEP <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input
                        className={inputClass('cep')}
                        placeholder="00000-000"
                        value={form.cep}
                        onChange={e => handleCEPChange(e.target.value)}
                        maxLength={9}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-[#13b9a5] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {!cepLoading && cepValid === true && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons-round text-emerald-500">check_circle</span>
                      )}
                      {!cepLoading && cepValid === false && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons-round text-red-500">error</span>
                      )}
                    </div>
                    {errorMessage('cep')}
                    {cepValid === true && !errors.cep && successIndicator(true)}
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Logradouro</label>
                    <input
                      className={inputClass()}
                      placeholder="Nome da rua, avenida..."
                      value={form.logradouro}
                      onChange={e => set('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Número</label>
                    <input
                      className={inputClass()}
                      placeholder="123"
                      value={form.numero}
                      onChange={e => set('numero', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Complemento</label>
                    <input
                      className={inputClass()}
                      placeholder="Ex: Sala 101"
                      value={form.complemento}
                      onChange={e => set('complemento', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Bairro</label>
                    <input
                      className={inputClass()}
                      placeholder="Ex: Centro"
                      value={form.bairro}
                      onChange={e => set('bairro', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Cidade</label>
                    <input
                      className={inputClass()}
                      placeholder="Ex: São Paulo"
                      value={form.cidade}
                      onChange={e => set('cidade', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">UF</label>
                    <select
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 outline-none transition-all"
                      value={form.uf}
                      onChange={e => set('uf', e.target.value)}
                    >
                      <option value="">UF</option>
                      {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Action Footer */}
              <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                <button
                  onClick={handleNextStep1}
                  className="flex items-center gap-3 px-8 h-[64px] bg-[#13b9a5] hover:bg-[#13b9a5]/90 text-white rounded-lg font-bold text-lg shadow-lg shadow-[#13b9a5]/30 transition-all active:scale-95"
                >
                  Próxima Etapa
                  <span className="material-icons-round">arrow_forward</span>
                </button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-8 text-center text-slate-500 text-sm">
            <p>© 2024 RotaClick Logistics. Todos os direitos reservados. Precisa de ajuda? <Link href="#" className="text-[#13b9a5] font-semibold hover:underline">Entre em contato.</Link></p>
          </footer>
        </div>
      </div>
    )
  }

  // ===== STEP 2 =====
  if (step === 2) {
    return (
      <div className="bg-[#f6f8f8] text-slate-800 min-h-screen font-display">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Cadastro de Transportador</h1>
              <p className="text-slate-500">Complete os dados da sua frota para começar a operar.</p>
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-semibold text-[#13b9a5] px-3 py-1 bg-[#13b9a5]/10 rounded-full">Etapa 2 de 3</span>
            </div>
          </header>

          {/* Stepper */}
          <nav className="grid grid-cols-3 gap-4 mb-12">
            {/* Step 1: Complete */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm opacity-80">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <span className="material-icons-round">check</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Etapa 1</p>
                <p className="font-bold text-slate-700">Dados Pessoais</p>
              </div>
            </div>
            {/* Step 2: Active */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#13b9a5] text-white shadow-lg shadow-[#13b9a5]/20 ring-2 ring-[#13b9a5] ring-offset-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-icons-round">local_shipping</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-wider font-bold text-white/70">Etapa 2</p>
                <p className="font-bold">Dados Operacionais</p>
              </div>
            </div>
            {/* Step 3: Inactive */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-60">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                <span className="material-icons-round">vpn_key</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Etapa 3</p>
                <p className="font-bold text-slate-400">Credenciais</p>
              </div>
            </div>
          </nav>

          {/* Form Container */}
          <main className="space-y-8">
            {/* Section 1: Frota e Capacidade */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="material-icons-round text-[#13b9a5]">inventory_2</span>
                <h2 className="text-xl font-bold">Frota e Capacidade</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Tipo de Veículo</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 outline-none transition-all"
                    value={form.tipoVeiculo}
                    onChange={e => set('tipoVeiculo', e.target.value)}
                  >
                    <option value="">Selecione o veículo</option>
                    <option value="Caminhão Toco">Caminhão Toco</option>
                    <option value="Caminhão Truck">Caminhão Truck</option>
                    <option value="Caminhão Bitruck">Caminhão Bitruck</option>
                    <option value="Carreta">Carreta</option>
                    <option value="Bitrem">Bitrem</option>
                    <option value="Rodotrem">Rodotrem</option>
                    <option value="Van">Van</option>
                    <option value="VUC">VUC</option>
                    <option value="Utilitário">Utilitário</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Tipo de Carroceria</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 outline-none transition-all"
                    value={form.tipoCarroceria}
                    onChange={e => set('tipoCarroceria', e.target.value)}
                  >
                    <option value="">Selecione a carroceria</option>
                    <option value="Baú">Baú</option>
                    <option value="Sider">Sider</option>
                    <option value="Graneleiro">Graneleiro</option>
                    <option value="Refrigerado">Refrigerado</option>
                    <option value="Tanque">Tanque</option>
                    <option value="Cegonha">Cegonha</option>
                    <option value="Prancha">Prancha</option>
                    <option value="Basculante">Basculante</option>
                    <option value="Container">Container</option>
                    <option value="Aberta">Aberta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Capacidade de Carga</label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 pr-12 outline-none transition-all"
                      placeholder="0"
                      type="number"
                      value={form.capacidadeCarga}
                      onChange={e => set('capacidadeCarga', e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-medium">kg</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Raio de Operação</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 outline-none transition-all"
                    value={form.raioOperacao}
                    onChange={e => set('raioOperacao', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="Municipal">Municipal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Regional">Regional</option>
                    <option value="Nacional">Nacional</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Regiões */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="material-icons-round text-[#13b9a5]">map</span>
                <h2 className="text-xl font-bold">Regiões de Atuação</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map(regiao => (
                  <button
                    key={regiao}
                    type="button"
                    onClick={() => toggleRegiao(regiao)}
                    className={`p-4 rounded-xl border-2 text-center font-bold transition-all ${
                      form.regioes.includes(regiao)
                        ? 'border-[#13b9a5] bg-[#13b9a5]/5 text-[#13b9a5] shadow-md shadow-[#13b9a5]/10'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-icons-round block mb-1 text-2xl">{form.regioes.includes(regiao) ? 'check_circle' : 'radio_button_unchecked'}</span>
                    {regiao}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 3: Informações Adicionais */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="material-icons-round text-[#13b9a5]">add_circle_outline</span>
                <h2 className="text-xl font-bold">Informações Adicionais <span className="text-sm font-normal text-slate-400">(Opcional)</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Consumo Médio</label>
                  <div className="relative">
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 pr-14 outline-none transition-all"
                      placeholder="0.00"
                      value={form.consumoMedio}
                      onChange={e => set('consumoMedio', e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-medium">km/L</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Quantidade de Eixos</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 outline-none transition-all"
                    placeholder="0"
                    type="number"
                    value={form.qtdEixos}
                    onChange={e => set('qtdEixos', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Número da Apólice</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-[#13b9a5] focus:border-[#13b9a5] py-2.5 px-3 outline-none transition-all"
                    placeholder="Ex: 12345678"
                    value={form.numeroApolice}
                    onChange={e => set('numeroApolice', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-8 bg-[#f6f8f8] p-5 rounded-lg border border-slate-100">
                <label className="inline-flex items-center cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={form.possuiRastreamento} onChange={e => set('possuiRastreamento', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13b9a5]"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700">Possui Rastreamento</span>
                </label>
                <label className="inline-flex items-center cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={form.possuiSeguro} onChange={e => set('possuiSeguro', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13b9a5]"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700">Possui Seguro de Carga</span>
                </label>
              </div>
            </section>

            {/* Navigation Buttons */}
            <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-8 py-3 rounded-lg border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-lg">arrow_back</span>
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-12 py-3 rounded-lg bg-[#13b9a5] text-white font-bold hover:bg-[#13b9a5]/90 transition-all shadow-lg shadow-[#13b9a5]/30 flex items-center justify-center gap-2"
              >
                Próxima Etapa
                <span className="material-icons-round text-lg">arrow_forward</span>
              </button>
            </footer>
          </main>
        </div>
      </div>
    )
  }

  // ===== STEP 2 =====
  return (
    <div className="bg-[#f6f8f8] text-slate-900 min-h-screen flex flex-col font-display">
      {/* Header Navigation */}
      <header className="bg-white border-b border-[#13b9a5]/10 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Image src="/logo.png" alt="RotaClick" width={180} height={57} priority />
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Suporte: 0800 123 4567</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Tracker */}
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
              {/* Step 1 Done */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#13b9a5] text-white flex items-center justify-center ring-4 ring-[#f6f8f8]">
                  <span className="material-icons-round text-xl">check</span>
                </div>
                <span className="text-xs font-bold text-slate-600">Dados Pessoais</span>
              </div>
              {/* Step 2 Active */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#13b9a5] text-white flex items-center justify-center ring-4 ring-[#f6f8f8] shadow-lg shadow-[#13b9a5]/30">
                  <span className="material-icons-round text-xl">shield</span>
                </div>
                <span className="text-xs font-bold text-[#13b9a5]">Credenciais</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8">
              {/* Section 1: Credenciais */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-[#13b9a5] rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">Credenciais de Acesso</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail Corporativo ou Pessoal</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#13b9a5] focus:border-[#13b9a5] transition-all text-slate-900 outline-none"
                      placeholder="exemplo@email.com"
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Definir Senha</label>
                      <div className="relative">
                        <input
                          className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#13b9a5] focus:border-[#13b9a5] transition-all text-slate-900 outline-none"
                          placeholder="••••••••"
                          type={showPassword ? 'text' : 'password'}
                          value={form.senha}
                          onChange={e => set('senha', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#13b9a5] transition-colors"
                        >
                          <span className="material-icons-round">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {form.senha && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-grow flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? 'bg-[#13b9a5]' : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold uppercase text-[#13b9a5]">{strengthLabels[strength]}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmar Senha</label>
                      <input
                        className={`w-full h-[56px] px-4 rounded-lg border bg-slate-50 focus:ring-2 focus:ring-[#13b9a5] focus:border-[#13b9a5] transition-all text-slate-900 outline-none ${form.confirmarSenha && form.confirmarSenha !== form.senha ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder="••••••••"
                        type="password"
                        value={form.confirmarSenha}
                        onChange={e => set('confirmarSenha', e.target.value)}
                      />
                      {form.confirmarSenha && form.confirmarSenha !== form.senha && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="material-icons-round text-red-500 text-sm">error</span>
                          <span className="text-xs font-medium text-red-500">As senhas não coincidem</span>
                        </div>
                      )}
                      {form.confirmarSenha && form.confirmarSenha === form.senha && form.senha.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="material-icons-round text-emerald-500 text-sm">check_circle</span>
                          <span className="text-xs font-medium text-emerald-500">Senhas coincidem</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Anexo da Apólice */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-[#13b9a5] rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">Apólice de Seguro</h2>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Anexar apólice (opcional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#13b9a5] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#10a794]"
                    onChange={(e) => handleApoliceFileChange(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-slate-500">Formatos permitidos: PDF, PNG e JPG (máximo 10MB).</p>
                  {form.apoliceSeguroFile && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      Arquivo selecionado: {form.apoliceSeguroFile.name}
                    </div>
                  )}
                </div>
              </section>

              {/* Section 2: Termos */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-[#13b9a5] rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">Termos e Condições</h2>
                </div>
                <div className="space-y-4">
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-slate-300 text-[#13b9a5] focus:ring-[#13b9a5] bg-white"
                        checked={form.aceitaTermos}
                        onChange={e => set('aceitaTermos', e.target.checked)}
                      />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      Li e aceito os <a href="/termos" className="text-[#13b9a5] font-bold underline hover:no-underline">Termos de Uso</a> da plataforma RotaClick, incluindo as responsabilidades de transporte.
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-slate-300 text-[#13b9a5] focus:ring-[#13b9a5] bg-white"
                        checked={form.aceitaPrivacidade}
                        onChange={e => set('aceitaPrivacidade', e.target.checked)}
                      />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      Estou ciente e concordo com a <a href="/privacidade" className="text-[#13b9a5] font-bold underline hover:no-underline">Política de Privacidade</a> referente ao tratamento de meus dados.
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-slate-300 text-[#13b9a5] focus:ring-[#13b9a5] bg-white"
                        checked={form.aceitaComunicacoes}
                        onChange={e => set('aceitaComunicacoes', e.target.checked)}
                      />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      Aceito receber comunicações sobre novas cargas, atualizações de sistema e marketing via WhatsApp ou E-mail.
                    </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded border-slate-300 text-[#13b9a5] focus:ring-[#13b9a5] bg-white"
                        checked={form.aceitaAnalise}
                        onChange={e => set('aceitaAnalise', e.target.checked)}
                      />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      Autorizo a RotaClick e seus parceiros a realizarem consultas para análise de crédito e antecedentes profissionais.
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Action Footer inside card */}
            <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-all w-full md:w-auto"
              >
                <span className="material-icons-round">arrow_back</span>
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-10 py-4 rounded-lg bg-[#13b9a5] text-white font-bold text-lg hover:bg-[#13b9a5]/90 shadow-lg shadow-[#13b9a5]/20 transition-all w-full md:w-auto transform active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Processando...' : 'Finalizar Cadastro'}</span>
                <span className="material-icons-round">check_circle</span>
              </button>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex justify-center items-center gap-6 opacity-60">
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <span className="material-icons-round text-slate-500">lock</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Conexão Segura SSL</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
              <span className="material-icons-round text-slate-500">verified_user</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">LGPD Compliance</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-slate-400 text-sm">
        <p>© 2024 RotaClick Logística. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
