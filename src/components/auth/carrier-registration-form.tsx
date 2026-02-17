'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { 
  carrierStep1Schema, 
  carrierStep2Schema, 
  carrierStep3Schema,
  type CarrierStep1Input,
  type CarrierStep2Input,
  type CarrierStep3Input,
  TIPOS_VEICULO,
  TIPOS_CARROCERIA,
  REGIOES_BRASIL,
  RAIOS_ATUACAO
} from '@/lib/validations/carrier-registration.schema'
import { maskCPF, maskPhone, maskRNTRC, removeMask } from '@/lib/utils/masks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Building2, Truck, Shield, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { registerCarrier } from '@/app/actions/carrier-registration-actions'
import { searchAddressByCEP } from '@/app/actions/cep-actions'

type FormData = CarrierStep1Input & CarrierStep2Input & CarrierStep3Input

export function CarrierRegistrationForm() {
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2' | 'step3'>('step1')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Form para Step 1
  const form1 = useForm<CarrierStep1Input>({
    resolver: zodResolver(carrierStep1Schema),
    mode: 'onBlur',
    defaultValues: {
      whatsappPermission: true,
    }
  })

  // Preencher dados do sessionStorage (vindos da validação CNPJ)
  useEffect(() => {
    if (dataLoaded || typeof window === 'undefined') return
    
    const savedData = sessionStorage.getItem('carrier_data')
    console.log('📦 SessionStorage carrier_data:', savedData)
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        console.log('📋 Dados parseados do sessionStorage:', data)
        const filledFields: string[] = []
        
        // Dados da empresa
        if (data.cnpj) {
          console.log('✅ Preenchendo CNPJ:', data.cnpj)
          form1.setValue('cnpj', data.cnpj)
          filledFields.push('CNPJ')
        }
        if (data.razao_social || data.nome_fantasia) {
          const companyName = data.nome_fantasia || data.razao_social
          console.log('✅ Preenchendo Nome da Empresa:', companyName)
          form1.setValue('companyName', companyName)
          filledFields.push('Nome da Empresa')
        }
        
        // Endereço (se disponível da Receita Federal)
        console.log('🏠 Dados de endereço:', data.endereco)
        if (data.endereco) {
          if (data.endereco.cep) {
            const cleanCEP = data.endereco.cep.replace(/\D/g, '')
            form1.setValue('cep', cleanCEP)
            filledFields.push('CEP')
          }
          if (data.endereco.logradouro) {
            form1.setValue('logradouro', data.endereco.logradouro)
            filledFields.push('Logradouro')
          }
          if (data.endereco.numero) {
            form1.setValue('numero', data.endereco.numero)
            filledFields.push('Número')
          }
          if (data.endereco.complemento) {
            form1.setValue('complemento', data.endereco.complemento)
            filledFields.push('Complemento')
          }
          if (data.endereco.bairro) {
            form1.setValue('bairro', data.endereco.bairro)
            filledFields.push('Bairro')
          }
          if (data.endereco.municipio) {
            form1.setValue('cidade', data.endereco.municipio)
            filledFields.push('Cidade')
          }
          if (data.endereco.uf) {
            form1.setValue('uf', data.endereco.uf)
            filledFields.push('UF')
          }
        }
        
        // Email e telefone (se disponíveis)
        if (data.email) {
          form3.setValue('email', data.email)
          filledFields.push('Email')
        }
        if (data.telefone) {
          const cleanPhone = data.telefone.replace(/\D/g, '')
          if (cleanPhone.length === 11) {
            form1.setValue('phone', cleanPhone)
            filledFields.push('Telefone')
          }
        }
        
        setAutoFilledFields(filledFields)
        setDataLoaded(true)
        
        if (filledFields.length > 0) {
          toast.success(`${filledFields.length} campos preenchidos automaticamente!`, {
            description: 'Revise os dados e complete as informações restantes.'
          })
        }
      } catch (e) {
        console.error('Erro ao ler dados da transportadora', e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Função para buscar endereço por CEP
  const handleCEPSearch = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '')
    console.log('Buscando CEP:', cleanCEP)
    
    if (cleanCEP.length !== 8) {
      console.log('CEP inválido, precisa ter 8 dígitos')
      return
    }

    setIsLoadingCEP(true)
    try {
      const result = await searchAddressByCEP(cleanCEP)
      console.log('Resultado da busca de CEP:', result)
      
      if (result.success && result.data) {
        form1.setValue('logradouro', result.data.logradouro)
        form1.setValue('bairro', result.data.bairro)
        form1.setValue('cidade', result.data.cidade)
        form1.setValue('uf', result.data.uf)
        if (result.data.complemento) {
          form1.setValue('complemento', result.data.complemento)
        }
        toast.success('Endereço encontrado!')
      } else {
        console.error('Erro ao buscar CEP:', result.error)
        toast.error(result.error || 'CEP não encontrado')
      }
    } catch (error) {
      console.error('Exceção ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP')
    } finally {
      setIsLoadingCEP(false)
    }
  }

  // Form para Step 2
  const form2 = useForm<CarrierStep2Input>({
    resolver: zodResolver(carrierStep2Schema),
    mode: 'onBlur',
    defaultValues: {
      possuiRastreamento: false,
      possuiSeguroCarga: false,
      regioesAtendimento: [],
    }
  })

  // Form para Step 3
  const form3 = useForm<CarrierStep3Input>({
    resolver: zodResolver(carrierStep3Schema),
    mode: 'onBlur',
    defaultValues: {
      acceptCommunications: false,
      acceptCreditAnalysis: false,
    }
  })

  const onSubmitStep1 = async (data: CarrierStep1Input) => {
    console.log('=== SUBMIT STEP 1 CHAMADO ===')
    console.log('Step 1 data:', data)
    console.log('Erros do formulário:', form1.formState.errors)
    
    try {
      setCompletedSteps(prev => new Set(prev).add('step1'))
      setCurrentStep('step2')
      toast.success('Dados pessoais salvos!')
      console.log('✅ Step 1 concluído, indo para Step 2')
    } catch (error) {
      console.error('❌ Erro no Step 1:', error)
      toast.error('Erro ao processar dados')
    }
  }

  const onSubmitStep2 = async (data: CarrierStep2Input) => {
    console.log('Step 2 data:', data)
    setCompletedSteps(prev => new Set(prev).add('step2'))
    setCurrentStep('step3')
    toast.success('Dados operacionais salvos!')
  }

  const onSubmitStep3 = async (data: CarrierStep3Input) => {
    console.log('=== INICIANDO SUBMIT STEP 3 ===')
    console.log('Step 3 data:', data)
    
    setIsLoading(true)
    
    // Combinar todos os dados
    const step1Data = form1.getValues()
    const step2Data = form2.getValues()
    
    console.log('Step 1 values:', step1Data)
    console.log('Step 2 values:', step2Data)
    
    const fullData: FormData = {
      ...step1Data,
      ...step2Data,
      ...data,
    }

    console.log('Dados completos para envio:', fullData)

    try {
      console.log('Chamando registerCarrier...')
      const result = await registerCarrier(fullData)
      
      console.log('Resultado do registerCarrier:', result)
      
      if (result?.error) {
        console.error('Erro retornado pela action:', result.error)
        toast.error(result.error)
        setIsLoading(false)
        return
      }
      
      // Limpar sessionStorage
      console.log('Limpando sessionStorage...')
      sessionStorage.removeItem('carrier_data')
      
      toast.success('Cadastro realizado com sucesso! Redirecionando...')
      console.log('=== CADASTRO FINALIZADO ===')
      // O redirect já é feito pela action
    } catch (error) {
      console.error('❌ EXCEÇÃO NO SUBMIT:', error)
      toast.error('Erro ao realizar cadastro')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <header className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="RotaClick" width={220} height={70} className="h-16 w-auto object-contain" priority />
        </div>
        <h1 className="text-[48px] font-extrabold leading-tight text-slate-900 mb-4">
          Cadastro de Transportadora
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Preencha as informações básicas para começar a operar na plataforma e conectar-se com novas oportunidades de frete.
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-4 mb-10">
        <div className={`flex-1 h-[64px] flex items-center justify-center gap-3 rounded-lg shadow-lg transition-all ${
          currentStep === 'step1' 
            ? 'bg-primary text-white shadow-primary/20 cursor-default' 
            : completedSteps.has('step1')
            ? 'bg-emerald-500 text-white cursor-default'
            : 'bg-slate-200/50 text-slate-500 cursor-not-allowed'
        }`}>
          {completedSteps.has('step1') ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="font-bold">Dados Pessoais</span>
        </div>
        <div className={`flex-1 h-[64px] flex items-center justify-center gap-3 rounded-lg shadow-lg transition-all ${
          currentStep === 'step2' 
            ? 'bg-primary text-white shadow-primary/20 cursor-default' 
            : completedSteps.has('step2')
            ? 'bg-emerald-500 text-white cursor-default'
            : 'bg-slate-200/50 text-slate-500 cursor-not-allowed'
        }`}>
          {completedSteps.has('step2') ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Truck className="h-5 w-5" />
          )}
          <span className="font-bold">Dados Operacionais</span>
        </div>
        <div className={`flex-1 h-[64px] flex items-center justify-center gap-3 rounded-lg shadow-lg transition-all ${
          currentStep === 'step3' 
            ? 'bg-primary text-white shadow-primary/20 cursor-default' 
            : 'bg-slate-200/50 text-slate-500 cursor-not-allowed'
        }`}>
          <Shield className="h-5 w-5" />
          <span className="font-bold">Credenciais</span>
        </div>
      </nav>

      {/* Form Steps */}
      <Tabs value={currentStep} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="step1">Step 1</TabsTrigger>
          <TabsTrigger value="step2">Step 2</TabsTrigger>
          <TabsTrigger value="step3">Step 3</TabsTrigger>
        </TabsList>

        {/* STEP 1: Dados Pessoais e Empresa */}
        <TabsContent value="step1">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-white/40">
            <form onSubmit={form1.handleSubmit(onSubmitStep1)} className="space-y-10">
              {/* Section 1: Dados do Responsável */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-800">Dados do Responsável</h2>
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Nome Completo *</label>
                    <input
                      id="fullName"
                      placeholder="Ex: João Silva"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('fullName')}
                    />
                    {form1.formState.errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">CPF *</label>
                    <input
                      id="cpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      onChange={(e) => {
                        const masked = maskCPF(e.target.value)
                        form1.setValue('cpf', removeMask(masked))
                        e.target.value = masked
                      }}
                    />
                    {form1.formState.errors.cpf && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.cpf.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Telefone *</label>
                    <input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value)
                        form1.setValue('phone', removeMask(masked))
                        e.target.value = masked
                      }}
                    />
                    {form1.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="whatsappPermission"
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                      checked={form1.watch('whatsappPermission')}
                      onChange={(e) => form1.setValue('whatsappPermission', e.target.checked)}
                    />
                    <label htmlFor="whatsappPermission" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Aceito receber mensagens via WhatsApp
                    </label>
                  </div>
                </div>
              </section>

              {/* Section 2: Dados da Empresa */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-800">Dados da Empresa</h2>
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Nome da Empresa *</label>
                    <input
                      id="companyName"
                      placeholder="Transportadora XYZ Ltda"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('companyName')}
                    />
                    {form1.formState.errors.companyName && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.companyName.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">CNPJ *</label>
                    <input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      disabled
                      className="w-full h-[48px] bg-slate-100 border border-slate-200 rounded-lg px-4 text-slate-500 cursor-not-allowed"
                      {...form1.register('cnpj')}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Inscrição Estadual *</label>
                    <input
                      id="inscricaoEstadual"
                      placeholder="000.000.000.000"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('inscricaoEstadual')}
                    />
                    {form1.formState.errors.inscricaoEstadual && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.inscricaoEstadual.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">RNTRC *</label>
                    <input
                      id="rntrc"
                      placeholder="00000000"
                      maxLength={12}
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      onChange={(e) => {
                        const masked = maskRNTRC(e.target.value)
                        form1.setValue('rntrc', masked)
                        e.target.value = masked
                      }}
                    />
                    {form1.formState.errors.rntrc && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.rntrc.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 3: Endereço */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-800">Endereço</h2>
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">CEP *</label>
                    <div className="relative">
                      <input
                        id="cep"
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          const masked = value.replace(/^(\d{5})(\d)/, '$1-$2')
                          e.target.value = masked
                          form1.setValue('cep', value)
                          if (value.length === 8) {
                            handleCEPSearch(value)
                          }
                        }}
                      />
                      {isLoadingCEP && (
                        <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-primary" />
                      )}
                    </div>
                    {form1.formState.errors.cep && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.cep.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Logradouro *</label>
                    <input
                      id="logradouro"
                      placeholder="Rua, Avenida, etc"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('logradouro')}
                    />
                    {form1.formState.errors.logradouro && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.logradouro.message}</p>
                    )}
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Número *</label>
                    <input
                      id="numero"
                      placeholder="123"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('numero')}
                    />
                    {form1.formState.errors.numero && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.numero.message}</p>
                    )}
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Complemento</label>
                    <input
                      id="complemento"
                      placeholder="Sala, Andar"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('complemento')}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Bairro *</label>
                    <input
                      id="bairro"
                      placeholder="Centro"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('bairro')}
                    />
                    {form1.formState.errors.bairro && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.bairro.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Cidade *</label>
                    <input
                      id="cidade"
                      placeholder="São Paulo"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none"
                      {...form1.register('cidade')}
                    />
                    {form1.formState.errors.cidade && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.cidade.message}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">UF *</label>
                    <input
                      id="uf"
                      placeholder="SP"
                      maxLength={2}
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 text-slate-900 placeholder:text-slate-400 outline-none uppercase"
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase()
                        form1.setValue('uf', e.target.value)
                      }}
                    />
                    {form1.formState.errors.uf && (
                      <p className="text-sm text-red-500 mt-1">{form1.formState.errors.uf.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Action Footer */}
              <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                <button className="flex items-center gap-3 px-8 h-[64px] bg-primary hover:bg-opacity-90 text-white rounded-lg font-bold text-lg shadow-lg shadow-primary/30 transition-all active:scale-95" type="submit">
                  Próxima Etapa
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* STEP 2: Dados Operacionais */}
        <TabsContent value="step2">
          <form onSubmit={form2.handleSubmit(onSubmitStep2)} className="space-y-8">
            {/* Section 1: Frota e Capacidade */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Frota e Capacidade</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Tipo de Veículo *</label>
                  <select
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4"
                    value={form2.watch('tipoVeiculoPrincipal') || ''}
                    onChange={(e) => form2.setValue('tipoVeiculoPrincipal', e.target.value as any)}
                  >
                    <option value="">Selecione o veículo</option>
                    {TIPOS_VEICULO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  {form2.formState.errors.tipoVeiculoPrincipal && (
                    <p className="text-sm text-red-500">{form2.formState.errors.tipoVeiculoPrincipal.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Tipo de Carroceria *</label>
                  <select
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4"
                    value={form2.watch('tipoCarroceriaPrincipal') || ''}
                    onChange={(e) => form2.setValue('tipoCarroceriaPrincipal', e.target.value as any)}
                  >
                    <option value="">Selecione a carroceria</option>
                    {TIPOS_CARROCERIA.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  {form2.formState.errors.tipoCarroceriaPrincipal && (
                    <p className="text-sm text-red-500">{form2.formState.errors.tipoCarroceriaPrincipal.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Capacidade de Carga *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 pr-12"
                      {...form2.register('capacidadeCargaToneladas', { valueAsNumber: true })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-medium">ton</div>
                  </div>
                  {form2.formState.errors.capacidadeCargaToneladas && (
                    <p className="text-sm text-red-500">{form2.formState.errors.capacidadeCargaToneladas.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Raio de Operação *</label>
                  <select
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4"
                    value={form2.watch('raioAtuacao') || ''}
                    onChange={(e) => form2.setValue('raioAtuacao', e.target.value as any)}
                  >
                    <option value="">Selecione o raio</option>
                    {RAIOS_ATUACAO.map(raio => (
                      <option key={raio.value} value={raio.value}>{raio.label}</option>
                    ))}
                  </select>
                  {form2.formState.errors.raioAtuacao && (
                    <p className="text-sm text-red-500">{form2.formState.errors.raioAtuacao.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Regiões de Atendimento */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Regiões de Atendimento</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {REGIOES_BRASIL.map(regiao => {
                  const isChecked = form2.watch('regioesAtendimento')?.includes(regiao.value as any)
                  return (
                    <div
                      key={regiao.value}
                      onClick={() => {
                        const current = form2.watch('regioesAtendimento') || []
                        if (isChecked) {
                          form2.setValue('regioesAtendimento', current.filter(r => r !== regiao.value))
                        } else {
                          form2.setValue('regioesAtendimento', [...current, regiao.value as any])
                        }
                      }}
                      className={`h-32 flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all cursor-pointer ${
                        isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-100 hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-primary text-white'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className={`font-bold text-sm text-center ${isChecked ? 'text-primary' : 'text-slate-600'}`}>
                        {regiao.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {form2.formState.errors.regioesAtendimento && (
                <p className="text-sm text-red-500 mt-2">{form2.formState.errors.regioesAtendimento.message}</p>
              )}
            </section>

            {/* Section 3: Informações Adicionais */}
            <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Informações Adicionais <span className="text-sm font-normal text-slate-400">(Opcional)</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Consumo Médio</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.00"
                      className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4 pr-14"
                      {...form2.register('consumoMedioDiesel', { valueAsNumber: true })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-medium">km/L</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Quantidade de Eixos</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4"
                    {...form2.register('numeroEixos', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Número da Apólice</label>
                  <input
                    placeholder="Ex: 12345678"
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary px-4"
                    {...form2.register('numeroApoliceSeguro')}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-8 bg-slate-50 p-5 rounded-lg border border-slate-100">
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form2.watch('possuiRastreamento')}
                      onChange={(e) => form2.setValue('possuiRastreamento', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700">Possui Rastreamento</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form2.watch('possuiSeguroCarga')}
                      onChange={(e) => form2.setValue('possuiSeguroCarga', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700">Possui Seguro de Carga</span>
                </label>
              </div>
            </section>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3 rounded-lg border-2 border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                onClick={() => setCurrentStep('step1')}
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-12 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                Próxima Etapa
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        </TabsContent>

        {/* STEP 3: Credenciais e Aceites */}
        <TabsContent value="step3">
          <form onSubmit={form3.handleSubmit(onSubmitStep3)}>
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-8">
                {/* Section 1: Credenciais */}
                <section className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-800">Credenciais de Acesso</h2>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail Corporativo ou Pessoal *</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="exemplo@email.com"
                        className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 outline-none"
                        {...form3.register('email')}
                      />
                      {form3.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-1">{form3.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Definir Senha *</label>
                        <input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 outline-none"
                          {...form3.register('password')}
                        />
                        {form3.formState.errors.password && (
                          <p className="text-sm text-red-500 mt-1">{form3.formState.errors.password.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmar Senha *</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="w-full h-[56px] px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 outline-none"
                          {...form3.register('confirmPassword')}
                        />
                        {form3.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-500 mt-1">{form3.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Termos */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-800">Termos e Condições</h2>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={form3.watch('acceptTerms')}
                          onChange={(e) => form3.setValue('acceptTerms', e.target.checked)}
                        />
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        Li e aceito os <a className="text-primary font-bold underline hover:no-underline" href="/termos" target="_blank">Termos de Uso</a> da plataforma RotaClick, incluindo as responsabilidades de transporte. *
                      </div>
                    </label>
                    {form3.formState.errors.acceptTerms && (
                      <p className="text-sm text-red-500 ml-10">{form3.formState.errors.acceptTerms.message}</p>
                    )}

                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={form3.watch('acceptPrivacy')}
                          onChange={(e) => form3.setValue('acceptPrivacy', e.target.checked)}
                        />
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        Estou ciente e concordo com a <a className="text-primary font-bold underline hover:no-underline" href="/privacidade" target="_blank">Política de Privacidade</a> referente ao tratamento de meus dados. *
                      </div>
                    </label>
                    {form3.formState.errors.acceptPrivacy && (
                      <p className="text-sm text-red-500 ml-10">{form3.formState.errors.acceptPrivacy.message}</p>
                    )}

                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={form3.watch('acceptCommunications')}
                          onChange={(e) => form3.setValue('acceptCommunications', e.target.checked)}
                        />
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        Aceito receber comunicações sobre novas cargas, atualizações de sistema e marketing via WhatsApp ou E-mail.
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          className="w-6 h-6 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={form3.watch('acceptCreditAnalysis')}
                          onChange={(e) => form3.setValue('acceptCreditAnalysis', e.target.checked)}
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
                  type="button"
                  className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-all w-full md:w-auto"
                  onClick={() => setCurrentStep('step2')}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-10 py-4 rounded-lg bg-primary text-white font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all w-full md:w-auto active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Finalizar Cadastro
                      <CheckCircle2 className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Page Footer */}
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>© 2024 RotaClick Logistics. Todos os direitos reservados. Precisa de ajuda? <a className="text-primary font-semibold hover:underline" href="#">Entre em contato.</a></p>
      </footer>
    </div>
  )
}
