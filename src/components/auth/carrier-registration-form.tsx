'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Building2, Truck, Shield, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { registerCarrier } from '@/app/actions/carrier-registration-actions'

type FormData = CarrierStep1Input & CarrierStep2Input & CarrierStep3Input

export function CarrierRegistrationForm() {
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2' | 'step3'>('step1')
  const [isLoading, setIsLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  // Form para Step 1
  const form1 = useForm<CarrierStep1Input>({
    resolver: zodResolver(carrierStep1Schema),
    defaultValues: {
      whatsappPermission: true,
    }
  })

  // Preencher dados do sessionStorage (vindos da validação CNPJ)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('carrier_data')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          if (data.cnpj) form1.setValue('cnpj', data.cnpj)
          if (data.razao_social || data.nome_fantasia) {
            form1.setValue('companyName', data.nome_fantasia || data.razao_social)
          }
        } catch (e) {
          console.error('Erro ao ler dados da transportadora', e)
        }
      }
    }
  }, [])

  // Form para Step 2
  const form2 = useForm<CarrierStep2Input>({
    resolver: zodResolver(carrierStep2Schema),
    defaultValues: {
      possuiRastreamento: false,
      possuiSeguroCarga: false,
      regioesAtendimento: [],
    }
  })

  // Form para Step 3
  const form3 = useForm<CarrierStep3Input>({
    resolver: zodResolver(carrierStep3Schema),
    defaultValues: {
      acceptCommunications: false,
      acceptCreditAnalysis: false,
    }
  })

  const onSubmitStep1 = async (data: CarrierStep1Input) => {
    console.log('Step 1 data:', data)
    setCompletedSteps(prev => new Set(prev).add('step1'))
    setCurrentStep('step2')
    toast.success('Dados pessoais salvos!')
  }

  const onSubmitStep2 = async (data: CarrierStep2Input) => {
    console.log('Step 2 data:', data)
    setCompletedSteps(prev => new Set(prev).add('step2'))
    setCurrentStep('step3')
    toast.success('Dados operacionais salvos!')
  }

  const onSubmitStep3 = async (data: CarrierStep3Input) => {
    setIsLoading(true)
    
    // Combinar todos os dados
    const fullData: FormData = {
      ...form1.getValues(),
      ...form2.getValues(),
      ...data,
    }

    try {
      const result = await registerCarrier(fullData)
      
      if (result?.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }
      
      // Limpar sessionStorage
      sessionStorage.removeItem('carrier_data')
      
      toast.success('Cadastro realizado com sucesso! Redirecionando...')
      // O redirect já é feito pela action
    } catch (error) {
      toast.error('Erro ao realizar cadastro')
      console.error(error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl border-2 border-brand-200 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-black text-brand-700">
          Cadastro de Transportadora
        </CardTitle>
        <CardDescription className="text-lg">
          Complete seu cadastro em 3 etapas simples
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger 
              value="step1" 
              disabled={currentStep !== 'step1'}
              className="data-[state=active]:bg-brand-500 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
              {completedSteps.has('step1') && <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="step2" 
              disabled={currentStep === 'step1'}
              className="data-[state=active]:bg-brand-500 data-[state=active]:text-white"
            >
              <Truck className="h-4 w-4 mr-2" />
              Dados Operacionais
              {completedSteps.has('step2') && <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="step3" 
              disabled={currentStep !== 'step3'}
              className="data-[state=active]:bg-brand-500 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Credenciais
            </TabsTrigger>
          </TabsList>

          {/* STEP 1: Dados Pessoais e Empresa */}
          <TabsContent value="step1">
            <form onSubmit={form1.handleSubmit(onSubmitStep1)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Responsável
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="João Silva"
                      {...form1.register('fullName')}
                    />
                    {form1.formState.errors.fullName && (
                      <p className="text-sm text-red-500">{form1.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      {...form1.register('cpf')}
                      onChange={(e) => {
                        const masked = maskCPF(e.target.value)
                        form1.setValue('cpf', removeMask(masked))
                        e.target.value = masked
                      }}
                    />
                    {form1.formState.errors.cpf && (
                      <p className="text-sm text-red-500">{form1.formState.errors.cpf.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone Celular *</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      {...form1.register('phone')}
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value)
                        form1.setValue('phone', removeMask(masked))
                        e.target.value = masked
                      }}
                    />
                    {form1.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form1.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="whatsappPermission"
                      checked={form1.watch('whatsappPermission')}
                      onCheckedChange={(checked) => form1.setValue('whatsappPermission', checked as boolean)}
                    />
                    <Label htmlFor="whatsappPermission" className="text-sm">
                      Aceito receber mensagens via WhatsApp
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Transportadora XYZ Ltda"
                      {...form1.register('companyName')}
                    />
                    {form1.formState.errors.companyName && (
                      <p className="text-sm text-red-500">{form1.formState.errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...form1.register('cnpj')}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual *</Label>
                    <Input
                      id="inscricaoEstadual"
                      placeholder="000.000.000.000"
                      {...form1.register('inscricaoEstadual')}
                    />
                    {form1.formState.errors.inscricaoEstadual && (
                      <p className="text-sm text-red-500">{form1.formState.errors.inscricaoEstadual.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rntrc">RNTRC *</Label>
                    <Input
                      id="rntrc"
                      placeholder="00000000"
                      maxLength={12}
                      {...form1.register('rntrc')}
                      onChange={(e) => {
                        const masked = maskRNTRC(e.target.value)
                        form1.setValue('rntrc', masked)
                      }}
                    />
                    {form1.formState.errors.rntrc && (
                      <p className="text-sm text-red-500">{form1.formState.errors.rntrc.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-brand-500 hover:bg-brand-600">
                  Próxima Etapa <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* STEP 2: Dados Operacionais */}
          <TabsContent value="step2">
            <form onSubmit={form2.handleSubmit(onSubmitStep2)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700">Frota e Capacidade</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoVeiculoPrincipal">Tipo de Veículo Principal *</Label>
                    <Select
                      value={form2.watch('tipoVeiculoPrincipal')}
                      onValueChange={(value) => form2.setValue('tipoVeiculoPrincipal', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_VEICULO.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form2.formState.errors.tipoVeiculoPrincipal && (
                      <p className="text-sm text-red-500">{form2.formState.errors.tipoVeiculoPrincipal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoCarroceriaPrincipal">Tipo de Carroceria Principal *</Label>
                    <Select
                      value={form2.watch('tipoCarroceriaPrincipal')}
                      onValueChange={(value) => form2.setValue('tipoCarroceriaPrincipal', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CARROCERIA.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form2.formState.errors.tipoCarroceriaPrincipal && (
                      <p className="text-sm text-red-500">{form2.formState.errors.tipoCarroceriaPrincipal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacidadeCargaToneladas">Capacidade de Carga (toneladas) *</Label>
                    <Input
                      id="capacidadeCargaToneladas"
                      type="number"
                      placeholder="30"
                      {...form2.register('capacidadeCargaToneladas', { valueAsNumber: true })}
                    />
                    {form2.formState.errors.capacidadeCargaToneladas && (
                      <p className="text-sm text-red-500">{form2.formState.errors.capacidadeCargaToneladas.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raioAtuacao">Raio de Atuação *</Label>
                    <Select
                      value={form2.watch('raioAtuacao')}
                      onValueChange={(value) => form2.setValue('raioAtuacao', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {RAIOS_ATUACAO.map(raio => (
                          <SelectItem key={raio.value} value={raio.value}>
                            {raio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form2.formState.errors.raioAtuacao && (
                      <p className="text-sm text-red-500">{form2.formState.errors.raioAtuacao.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regiões que Atende *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {REGIOES_BRASIL.map(regiao => (
                      <div key={regiao.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`regiao-${regiao.value}`}
                          checked={form2.watch('regioesAtendimento')?.includes(regiao.value as any)}
                          onCheckedChange={(checked) => {
                            const current = form2.watch('regioesAtendimento') || []
                            if (checked) {
                              form2.setValue('regioesAtendimento', [...current, regiao.value as any])
                            } else {
                              form2.setValue('regioesAtendimento', current.filter(r => r !== regiao.value))
                            }
                          }}
                        />
                        <Label htmlFor={`regiao-${regiao.value}`} className="text-sm font-normal">
                          {regiao.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {form2.formState.errors.regioesAtendimento && (
                    <p className="text-sm text-red-500">{form2.formState.errors.regioesAtendimento.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700">Informações Adicionais (Opcional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consumoMedioDiesel">Consumo Médio (km/l)</Label>
                    <Input
                      id="consumoMedioDiesel"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      {...form2.register('consumoMedioDiesel', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroEixos">Número de Eixos</Label>
                    <Input
                      id="numeroEixos"
                      type="number"
                      placeholder="5"
                      {...form2.register('numeroEixos', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroApoliceSeguro">Nº Apólice de Seguro</Label>
                    <Input
                      id="numeroApoliceSeguro"
                      placeholder="000000000"
                      {...form2.register('numeroApoliceSeguro')}
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="possuiRastreamento"
                      checked={form2.watch('possuiRastreamento')}
                      onCheckedChange={(checked) => form2.setValue('possuiRastreamento', checked as boolean)}
                    />
                    <Label htmlFor="possuiRastreamento" className="text-sm font-normal">
                      Possui rastreamento
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="possuiSeguroCarga"
                      checked={form2.watch('possuiSeguroCarga')}
                      onCheckedChange={(checked) => form2.setValue('possuiSeguroCarga', checked as boolean)}
                    />
                    <Label htmlFor="possuiSeguroCarga" className="text-sm font-normal">
                      Possui seguro de carga
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCurrentStep('step1')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button type="submit" className="bg-brand-500 hover:bg-brand-600">
                  Próxima Etapa <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* STEP 3: Credenciais e Aceites */}
          <TabsContent value="step3">
            <form onSubmit={form3.handleSubmit(onSubmitStep3)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700">Credenciais de Acesso</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...form3.register('email')}
                    />
                    {form3.formState.errors.email && (
                      <p className="text-sm text-red-500">{form3.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...form3.register('password')}
                    />
                    {form3.formState.errors.password && (
                      <p className="text-sm text-red-500">{form3.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...form3.register('confirmPassword')}
                    />
                    {form3.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{form3.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-700">Termos e Condições</h3>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={form3.watch('acceptTerms')}
                      onCheckedChange={(checked) => form3.setValue('acceptTerms', checked as boolean)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
                      Aceito os <a href="/termos" target="_blank" className="text-brand-600 hover:underline">termos de uso</a> *
                    </Label>
                  </div>
                  {form3.formState.errors.acceptTerms && (
                    <p className="text-sm text-red-500 ml-6">{form3.formState.errors.acceptTerms.message}</p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={form3.watch('acceptPrivacy')}
                      onCheckedChange={(checked) => form3.setValue('acceptPrivacy', checked as boolean)}
                    />
                    <Label htmlFor="acceptPrivacy" className="text-sm font-normal leading-relaxed">
                      Aceito a <a href="/privacidade" target="_blank" className="text-brand-600 hover:underline">política de privacidade</a> *
                    </Label>
                  </div>
                  {form3.formState.errors.acceptPrivacy && (
                    <p className="text-sm text-red-500 ml-6">{form3.formState.errors.acceptPrivacy.message}</p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptCommunications"
                      checked={form3.watch('acceptCommunications')}
                      onCheckedChange={(checked) => form3.setValue('acceptCommunications', checked as boolean)}
                    />
                    <Label htmlFor="acceptCommunications" className="text-sm font-normal leading-relaxed">
                      Aceito receber comunicações e ofertas da RotaClick
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptCreditAnalysis"
                      checked={form3.watch('acceptCreditAnalysis')}
                      onCheckedChange={(checked) => form3.setValue('acceptCreditAnalysis', checked as boolean)}
                    />
                    <Label htmlFor="acceptCreditAnalysis" className="text-sm font-normal leading-relaxed">
                      Autorizo o compartilhamento de dados para análise de crédito
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCurrentStep('step2')}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-500 hover:bg-brand-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Finalizar Cadastro <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
