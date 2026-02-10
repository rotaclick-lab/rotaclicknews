import { 
  LayoutDashboard, 
  DollarSign, 
  Calculator,
  Eye,
  History,
  Route,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const APP_NAME = 'RotaClick'
export const APP_DESCRIPTION = 'Sistema de Gestão de Fretes para Transportadoras'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/registro',
  TRANSPORTADORA: '/transportadora',
  DASHBOARD: '/dashboard',
  FREIGHTS: '/fretes',
  MARKETPLACE: '/marketplace',
  FINANCIAL: '/financeiro',
  FREIGHT_TABLE: '/tabela-frete',
  PROFILE: '/perfil',
} as const

export const MAX_FREIGHT_WEIGHT = 30000 // kg
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema'
  },
  {
    title: 'Tabela de Frete',
    href: '/tabela-frete',
    icon: Calculator,
    description: 'Gestão de rotas e preços'
  },
  {
    title: 'Cotações Recebidas',
    href: '/cotacoes-recebidas',
    icon: Eye,
    description: 'Vezes que apareceu em cotações'
  },
  {
    title: 'Histórico',
    href: '/historico',
    icon: History,
    description: 'Histórico de contratações'
  },
  {
    title: 'Rotas Realizadas',
    href: '/rotas-realizadas',
    icon: Route,
    description: 'Rotas que você realizou'
  },

  {
    title: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
    description: 'Controle financeiro'
  },
]

// Freight Status
export const FREIGHT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const FREIGHT_STATUS_LABELS = {
  [FREIGHT_STATUS.PENDING]: 'Pendente',
  [FREIGHT_STATUS.IN_PROGRESS]: 'Em Andamento',
  [FREIGHT_STATUS.DELIVERED]: 'Entregue',
  [FREIGHT_STATUS.CANCELLED]: 'Cancelado',
} as const;

export const FREIGHT_STATUS_COLORS = {
  [FREIGHT_STATUS.PENDING]: 'warning',
  [FREIGHT_STATUS.IN_PROGRESS]: 'brand',
  [FREIGHT_STATUS.DELIVERED]: 'success',
  [FREIGHT_STATUS.CANCELLED]: 'danger',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.PAID]: 'Pago',
  [PAYMENT_STATUS.OVERDUE]: 'Atrasado',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  PIX: 'pix',
  BANK_SLIP: 'bank_slip',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Dinheiro',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Cartão de Crédito',
  [PAYMENT_METHODS.DEBIT_CARD]: 'Cartão de Débito',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Transferência Bancária',
  [PAYMENT_METHODS.PIX]: 'PIX',
  [PAYMENT_METHODS.BANK_SLIP]: 'Boleto',
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  VAN: 'van',
  TRUCK: 'truck',
  SEMI_TRUCK: 'semi_truck',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
} as const;

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.VAN]: 'Van',
  [VEHICLE_TYPES.TRUCK]: 'Caminhão',
  [VEHICLE_TYPES.SEMI_TRUCK]: 'Carreta',
  [VEHICLE_TYPES.MOTORCYCLE]: 'Moto',
  [VEHICLE_TYPES.CAR]: 'Carro',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
  CUSTOMER: 'customer',
  CARRIER: 'transportadora',
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.MANAGER]: 'Gerente',
  [USER_ROLES.DRIVER]: 'Motorista',
  [USER_ROLES.CUSTOMER]: 'Cliente',
  [USER_ROLES.CARRIER]: 'Transportadora',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_LENGTH: 11,
  CPF_LENGTH: 11,
  CNPJ_LENGTH: 14,
  CEP_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Brazilian States
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;
