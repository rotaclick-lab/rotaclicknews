'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// ===== MASKS =====
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
const maskCNPJ = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')

// ===== TYPES =====
interface FormData {
  // Step 1
  nomeCompleto: string
  cpf: string
  telefone: string
  razaoSocial: string
  cnpj: string
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
  aceitaTermos: boolean
  aceitaPrivacidade: boolean
  aceitaComunicacoes: boolean
  aceitaAnalise: boolean
}

const UF_OPTIONS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<FormData>({
    nomeCompleto: '', cpf: '', telefone: '',
    razaoSocial: '', cnpj: '', inscricaoEstadual: '', rntrc: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    tipoVeiculo: '', tipoCarroceria: '', capacidadeCarga: '', raioOperacao: '',
    regioes: [], consumoMedio: '', qtdEixos: '', numeroApolice: '',
    possuiRastreamento: true, possuiSeguro: false,
    email: '', senha: '', confirmarSenha: '',
    aceitaTermos: false, aceitaPrivacidade: false, aceitaComunicacoes: false, aceitaAnalise: false,
  })

  const set = useCallback((field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const toggleRegiao = (regiao: string) => {
    setForm(prev => ({
      ...prev,
      regioes: prev.regioes.includes(regiao)
        ? prev.regioes.filter(r => r !== regiao)
        : [...prev.regioes, regiao]
    }))
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

  // CEP lookup
  const buscarCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
          }))
        }
      } catch {}
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    // TODO: integrar com Supabase
    setTimeout(() => {
      setLoading(false)
      router.push('/login')
    }, 2000)
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
              <span className="material-icons-round">settings</span>
              <span className="font-bold">Dados Operacionais</span>
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
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Ex: João Silva"
                      value={form.nomeCompleto}
                      onChange={e => set('nomeCompleto', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[18px] font-medium text-slate-700 mb-2">CPF</label>
                      <input
                        className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                        placeholder="000.000.000-00"
                        value={form.cpf}
                        onChange={e => set('cpf', maskCPF(e.target.value))}
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <label className="block text-[18px] font-medium text-slate-700 mb-2">Telefone</label>
                      <input
                        className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
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
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Razão Social</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Nome da sua transportadora"
                      value={form.razaoSocial}
                      onChange={e => set('razaoSocial', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">CNPJ</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed italic outline-none"
                      disabled
                      value={form.cnpj || '12.345.678/0001-90'}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Inscrição Estadual</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Ex: 123456789"
                      value={form.inscricaoEstadual}
                      onChange={e => set('inscricaoEstadual', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">RNTRC</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Registro na ANTT"
                      value={form.rntrc}
                      onChange={e => set('rntrc', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Endereço */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <span className="material-icons-round text-[#13b9a5]">place</span>
                  <h2 className="text-xl font-bold text-slate-800">Endereço</h2>
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">CEP</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={e => {
                        const masked = maskCEP(e.target.value)
                        set('cep', masked)
                        buscarCEP(masked)
                      }}
                      maxLength={9}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Logradouro</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Nome da rua, avenida..."
                      value={form.logradouro}
                      onChange={e => set('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Número</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="123"
                      value={form.numero}
                      onChange={e => set('numero', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Complemento</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Ex: Sala 101"
                      value={form.complemento}
                      onChange={e => set('complemento', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Bairro</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                      placeholder="Ex: Centro"
                      value={form.bairro}
                      onChange={e => set('bairro', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[18px] font-medium text-slate-700 mb-2">Cidade</label>
                    <input
                      className="w-full h-[56px] px-4 rounded-lg border border-slate-200 focus:border-[#13b9a5] focus:ring-2 focus:ring-[#13b9a5] bg-white/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
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
                  onClick={() => setStep(2)}
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
                    <option>Toco</option>
                    <option>Truck</option>
                    <option>Bitruck</option>
                    <option>Carreta 2 Eixos</option>
                    <option>Carreta 3 Eixos</option>
                    <option>Vanderleia</option>
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
                    <option>Baú</option>
                    <option>Sider</option>
                    <option>Grade Baixa</option>
                    <option>Graneleiro</option>
                    <option>Prancha</option>
                    <option>Frigorífico</option>
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
                    <option value="">Selecione o raio (km)</option>
                    <option>Até 100km</option>
                    <option>Até 500km</option>
                    <option>Até 1000km</option>
                    <option>Todo Brasil</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Regiões de Atendimento */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="material-icons-round text-[#13b9a5]">map</span>
                <h2 className="text-xl font-bold">Regiões de Atendimento</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map(regiao => (
                  <label key={regiao} className="group relative cursor-pointer" onClick={() => toggleRegiao(regiao)}>
                    <input type="checkbox" className="peer sr-only" checked={form.regioes.includes(regiao)} readOnly />
                    <div className={`h-32 flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all hover:border-[#13b9a5]/50 ${
                      form.regioes.includes(regiao)
                        ? 'border-[#13b9a5] bg-[#13b9a5]/5'
                        : 'border-slate-100'
                    }`}>
                      <div className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center transition-colors ${
                        form.regioes.includes(regiao)
                          ? 'bg-[#13b9a5] text-white'
                          : 'bg-slate-50 text-slate-400 group-hover:text-[#13b9a5]'
                      }`}>
                        <span className="material-icons-round">explore</span>
                      </div>
                      <span className={`font-bold ${form.regioes.includes(regiao) ? 'text-[#13b9a5]' : 'text-slate-600'}`}>{regiao}</span>
                    </div>
                  </label>
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

  // ===== STEP 3 =====
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
              {/* Step 2 Done */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#13b9a5] text-white flex items-center justify-center ring-4 ring-[#f6f8f8]">
                  <span className="material-icons-round text-xl">check</span>
                </div>
                <span className="text-xs font-bold text-slate-600">Dados Operacionais</span>
              </div>
              {/* Step 3 Active */}
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
                        className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#13b9a5] focus:border-[#13b9a5] transition-all text-slate-900 outline-none"
                        placeholder="••••••••"
                        type="password"
                        value={form.confirmarSenha}
                        onChange={e => set('confirmarSenha', e.target.value)}
                      />
                    </div>
                  </div>
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
                      Li e aceito os <a href="#" className="text-[#13b9a5] font-bold underline hover:no-underline">Termos de Uso</a> da plataforma RotaClick, incluindo as responsabilidades de transporte.
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
                      Estou ciente e concordo com a <a href="#" className="text-[#13b9a5] font-bold underline hover:no-underline">Política de Privacidade</a> referente ao tratamento de meus dados.
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
                onClick={() => setStep(2)}
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
