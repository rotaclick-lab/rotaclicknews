import { z } from 'zod'

/**
 * Schemas de validação para cadastro de transportadora
 * Exportados para uso no formulário multi-step
 */

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '')
  
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cpf.charAt(10))) return false
  
  return true
}

// Schema para Etapa 1: Dados Pessoais e Empresa
export const carrierStep1Schema = z.object({
  // Dados Pessoais
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine(validateCPF, 'CPF inválido'),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10 || val.length === 11, 'Telefone deve ter 10 ou 11 dígitos')
    .refine(val => /^[1-9]{2}[0-9]{8,9}$/.test(val), 'Formato de telefone inválido'),
  whatsappPermission: z.boolean().default(true),
  
  // Dados da Empresa (preenchidos automaticamente)
  companyName: z.string().min(3, 'Nome da empresa é obrigatório'),
  cnpj: z.string()
    .length(14, 'CNPJ deve ter 14 dígitos')
    .regex(/^\d+$/, 'CNPJ deve conter apenas números'),
  inscricaoEstadual: z.string()
    .min(8, 'Inscrição Estadual deve ter no mínimo 8 caracteres')
    .max(18, 'Inscrição Estadual deve ter no máximo 18 caracteres'),
  rntrc: z.string()
    .min(8, 'RNTRC deve ter no mínimo 8 dígitos')
    .max(12, 'RNTRC deve ter no máximo 12 dígitos')
    .regex(/^\d+$/, 'RNTRC deve conter apenas números'),
  
  // Endereço
  cep: z.string()
    .length(8, 'CEP deve ter 8 dígitos')
    .regex(/^\d+$/, 'CEP deve conter apenas números'),
  logradouro: z.string().min(3, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
})

// Schema para Etapa 2: Dados Operacionais
export const carrierStep2Schema = z.object({
  // Frota
  tipoVeiculoPrincipal: z.enum([
    'Caminhão Toco',
    'Caminhão Truck',
    'Caminhão Bitruck',
    'Carreta',
    'Bitrem',
    'Rodotrem',
    'Van',
    'VUC',
    'Utilitário'
  ], { required_error: 'Selecione o tipo de veículo' }),
  
  tipoCarroceriaPrincipal: z.enum([
    'Baú',
    'Sider',
    'Graneleiro',
    'Refrigerado',
    'Tanque',
    'Cegonha',
    'Prancha',
    'Basculante',
    'Container',
    'Aberta'
  ], { required_error: 'Selecione o tipo de carroceria' }),
  
  capacidadeCargaToneladas: z.number()
    .int('Capacidade deve ser um número inteiro')
    .min(1, 'Capacidade mínima: 1 tonelada')
    .max(100, 'Capacidade máxima: 100 toneladas'),
  
  // Atuação
  regioesAtendimento: z.array(z.enum(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']))
    .min(1, 'Selecione pelo menos uma região'),
  
  raioAtuacao: z.enum(['Municipal', 'Estadual', 'Regional', 'Nacional'], {
    required_error: 'Selecione o raio de atuação'
  }),
  
  // Opcionais
  consumoMedioDiesel: z.number()
    .min(0.5, 'Consumo mínimo: 0.5 km/l')
    .max(20, 'Consumo máximo: 20 km/l')
    .optional(),
  
  numeroEixos: z.number()
    .int('Número de eixos deve ser inteiro')
    .min(2, 'Mínimo: 2 eixos')
    .max(9, 'Máximo: 9 eixos')
    .optional(),
  
  possuiRastreamento: z.boolean().default(false),
  possuiSeguroCarga: z.boolean().default(false),
  numeroApoliceSeguro: z.string().optional(),
})

// Schema para Etapa 3: Credenciais e Aceites
export const carrierStep3Schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  
  // Aceites
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'Você deve aceitar a política de privacidade'),
  acceptCommunications: z.boolean().default(false),
  acceptCreditAnalysis: z.boolean().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

// Schema completo (união de todas as etapas)
export const carrierRegistrationSchema = z.object({
  // Step 1
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, 'CPF deve ter 11 dígitos')
    .refine(validateCPF, 'CPF inválido'),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10 || val.length === 11, 'Telefone deve ter 10 ou 11 dígitos')
    .refine(val => /^[1-9]{2}[0-9]{8,9}$/.test(val), 'Formato de telefone inválido'),
  whatsappPermission: z.boolean().default(true),
  companyName: z.string().min(3, 'Nome da empresa é obrigatório'),
  cnpj: z.string()
    .length(14, 'CNPJ deve ter 14 dígitos')
    .regex(/^\d+$/, 'CNPJ deve conter apenas números'),
  inscricaoEstadual: z.string()
    .min(8, 'Inscrição Estadual deve ter no mínimo 8 caracteres')
    .max(18, 'Inscrição Estadual deve ter no máximo 18 caracteres'),
  rntrc: z.string()
    .min(8, 'RNTRC deve ter no mínimo 8 dígitos')
    .max(12, 'RNTRC deve ter no máximo 12 dígitos')
    .regex(/^\d+$/, 'RNTRC deve conter apenas números'),
  
  // Endereço
  cep: z.string()
    .length(8, 'CEP deve ter 8 dígitos')
    .regex(/^\d+$/, 'CEP deve conter apenas números'),
  logradouro: z.string().min(3, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  
  // Step 2
  tipoVeiculoPrincipal: z.enum([
    'Caminhão Toco',
    'Caminhão Truck',
    'Caminhão Bitruck',
    'Carreta',
    'Bitrem',
    'Rodotrem',
    'Van',
    'VUC',
    'Utilitário'
  ], { required_error: 'Selecione o tipo de veículo' }),
  tipoCarroceriaPrincipal: z.enum([
    'Baú',
    'Sider',
    'Graneleiro',
    'Refrigerado',
    'Tanque',
    'Cegonha',
    'Prancha',
    'Basculante',
    'Container',
    'Aberta'
  ], { required_error: 'Selecione o tipo de carroceria' }),
  capacidadeCargaToneladas: z.number()
    .int('Capacidade deve ser um número inteiro')
    .min(1, 'Capacidade mínima: 1 tonelada')
    .max(100, 'Capacidade máxima: 100 toneladas'),
  regioesAtendimento: z.array(z.enum(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']))
    .min(1, 'Selecione pelo menos uma região'),
  raioAtuacao: z.enum(['Municipal', 'Estadual', 'Regional', 'Nacional'], {
    required_error: 'Selecione o raio de atuação'
  }),
  consumoMedioDiesel: z.number()
    .min(0.5, 'Consumo mínimo: 0.5 km/l')
    .max(20, 'Consumo máximo: 20 km/l')
    .optional(),
  numeroEixos: z.number()
    .int('Número de eixos deve ser inteiro')
    .min(2, 'Mínimo: 2 eixos')
    .max(9, 'Máximo: 9 eixos')
    .optional(),
  possuiRastreamento: z.boolean().default(false),
  possuiSeguroCarga: z.boolean().default(false),
  numeroApoliceSeguro: z.string().optional(),
  
  // Step 3
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'Você deve aceitar a política de privacidade'),
  acceptCommunications: z.boolean().default(false),
  acceptCreditAnalysis: z.boolean().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

// Tipos TypeScript
export type CarrierStep1Input = z.infer<typeof carrierStep1Schema>
export type CarrierStep2Input = z.infer<typeof carrierStep2Schema>
export type CarrierStep3Input = z.infer<typeof carrierStep3Schema>
export type CarrierRegistrationInput = z.infer<typeof carrierRegistrationSchema>

// Constantes para dropdowns
export const TIPOS_VEICULO = [
  { value: 'Caminhão Toco', label: 'Caminhão Toco (2 eixos)' },
  { value: 'Caminhão Truck', label: 'Caminhão Truck (3 eixos)' },
  { value: 'Caminhão Bitruck', label: 'Caminhão Bitruck (4 eixos)' },
  { value: 'Carreta', label: 'Carreta (5-6 eixos)' },
  { value: 'Bitrem', label: 'Bitrem (7 eixos)' },
  { value: 'Rodotrem', label: 'Rodotrem (9 eixos)' },
  { value: 'Van', label: 'Van' },
  { value: 'VUC', label: 'VUC (Veículo Urbano de Carga)' },
  { value: 'Utilitário', label: 'Utilitário' },
] as const

export const TIPOS_CARROCERIA = [
  { value: 'Baú', label: 'Baú' },
  { value: 'Sider', label: 'Sider (cortina)' },
  { value: 'Graneleiro', label: 'Graneleiro' },
  { value: 'Refrigerado', label: 'Refrigerado' },
  { value: 'Tanque', label: 'Tanque' },
  { value: 'Cegonha', label: 'Cegonha' },
  { value: 'Prancha', label: 'Prancha' },
  { value: 'Basculante', label: 'Basculante' },
  { value: 'Container', label: 'Container' },
  { value: 'Aberta', label: 'Aberta' },
] as const

export const REGIOES_BRASIL = [
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' },
] as const

export const RAIOS_ATUACAO = [
  { value: 'Municipal', label: 'Municipal (mesma cidade)' },
  { value: 'Estadual', label: 'Estadual (mesmo estado)' },
  { value: 'Regional', label: 'Regional (estados vizinhos)' },
  { value: 'Nacional', label: 'Nacional (todo o Brasil)' },
] as const
