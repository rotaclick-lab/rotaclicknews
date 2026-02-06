# 📘 Database Types - RotaClick

## 🎯 Visão Geral

Este documento descreve os types TypeScript gerados automaticamente do schema do Supabase e como utilizá-los no projeto.

## 📁 Arquivos

### `src/types/database.types.ts`
- **Gerado automaticamente** pelo Supabase CLI
- **NÃO EDITE MANUALMENTE** este arquivo
- Para regenerar: `npx supabase gen types typescript --linked > src/types/database.types.ts`

### `src/types/index.ts`
- Types auxiliares e helpers
- Re-exporta os types do database
- Types para formulários, API responses, etc.

## 🗂️ Types de Tabelas

### Padrão de Nomenclatura

Para cada tabela, existem 3 types:

```typescript
// Row: Dados completos da linha (SELECT)
type Company = Database['public']['Tables']['companies']['Row']

// Insert: Dados para inserção (INSERT)
type CompanyInsert = Database['public']['Tables']['companies']['Insert']

// Update: Dados para atualização (UPDATE)
type CompanyUpdate = Database['public']['Tables']['companies']['Update']
```

### Tabelas Disponíveis

#### 🏢 Companies (Transportadoras)
```typescript
import type { Company, CompanyInsert, CompanyUpdate } from '@/types'

const company: Company = {
  id: 'uuid',
  name: 'Transportadora ABC',
  document: '12.345.678/0001-90',
  email: 'contato@abc.com',
  phone: '(11) 98765-4321',
  address: {
    street: 'Rua A',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  },
  logo_url: null,
  settings: {},
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 👤 Users (Usuários)
```typescript
import type { User, UserRole } from '@/types'

const user: User = {
  id: 'uuid',
  company_id: 'uuid',
  role: 'admin', // owner | admin | manager | driver | client
  full_name: 'João Silva',
  email: 'joao@abc.com',
  phone: '(11) 98765-4321',
  avatar_url: null,
  is_active: true,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 🚗 Drivers (Motoristas)
```typescript
import type { Driver } from '@/types'

const driver: Driver = {
  id: 'uuid',
  company_id: 'uuid',
  user_id: 'uuid',
  full_name: 'José Santos',
  cpf: '123.456.789-00',
  cnh: '12345678900',
  cnh_category: 'D',
  phone: '(11) 98765-4321',
  email: 'jose@abc.com',
  avatar_url: null,
  address: {...},
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 🚛 Vehicles (Veículos)
```typescript
import type { Vehicle, VehicleType, VehicleStatus } from '@/types'

const vehicle: Vehicle = {
  id: 'uuid',
  company_id: 'uuid',
  license_plate: 'ABC-1234',
  type: 'truck', // van | truck | semi_truck | motorcycle | car
  brand: 'Mercedes',
  model: 'Actros',
  year: 2022,
  color: 'Branco',
  capacity_kg: 15000,
  capacity_m3: 30,
  status: 'active', // active | maintenance | inactive
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 👥 Customers (Clientes)
```typescript
import type { Customer } from '@/types'

const customer: Customer = {
  id: 'uuid',
  company_id: 'uuid',
  name: 'Cliente XYZ Ltda',
  document: '12.345.678/0001-90',
  email: 'contato@xyz.com',
  phone: '(11) 98765-4321',
  address: {...},
  is_active: true,
  notes: 'Cliente preferencial',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 📦 Freights (Fretes)
```typescript
import type { Freight, FreightStatus } from '@/types'

const freight: Freight = {
  id: 'uuid',
  company_id: 'uuid',
  customer_id: 'uuid',
  driver_id: 'uuid',
  vehicle_id: 'uuid',
  code: 'FRT-00000001',
  status: 'pending', // pending | in_transit | delivered | cancelled
  origin: {
    street: 'Rua A',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    latitude: -23.550520,
    longitude: -46.633308
  },
  destination: {...},
  distance_km: 450,
  weight_kg: 5000,
  volume_m3: 10,
  description: 'Carga de eletrônicos',
  freight_value: 2500.00,
  additional_costs: 100.00,
  discount: 50.00,
  total_value: 2550.00, // Calculado automaticamente
  scheduled_date: '2024-02-10T08:00:00Z',
  pickup_date: null,
  delivery_date: null,
  notes: 'Entregar pela manhã',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

#### 📋 Freight Items (Itens do Frete)
```typescript
import type { FreightItem } from '@/types'

const item: FreightItem = {
  id: 'uuid',
  freight_id: 'uuid',
  description: 'Notebook Dell',
  quantity: 10,
  weight_kg: 20,
  volume_m3: 0.5,
  value: 25000.00,
  notes: 'Frágil',
  created_at: '2024-01-01T00:00:00Z'
}
```

#### 💰 Financial Transactions (Transações)
```typescript
import type { FinancialTransaction, TransactionType, PaymentStatus } from '@/types'

const transaction: FinancialTransaction = {
  id: 'uuid',
  company_id: 'uuid',
  freight_id: 'uuid',
  type: 'income', // income | expense
  category: 'Frete',
  description: 'Pagamento frete FRT-00000001',
  amount: 2550.00,
  payment_method: 'pix',
  payment_status: 'paid', // pending | paid | overdue | cancelled
  due_date: '2024-02-15',
  paid_date: '2024-02-14',
  reference_code: 'PIX-123456',
  invoice_url: null,
  notes: null,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}
```

## 🔄 Types com Relacionamentos

### FreightWithRelations
```typescript
import type { FreightWithRelations } from '@/types'

const freightFull: FreightWithRelations = {
  ...freight,
  customer: customer,
  driver: driver,
  vehicle: vehicle,
  items: [item1, item2],
  tracking: [track1, track2]
}
```

## 📝 Types para Formulários

### FreightForm
```typescript
import type { FreightForm } from '@/types'

const form: FreightForm = {
  customer_id: 'uuid',
  driver_id: 'uuid',
  vehicle_id: 'uuid',
  origin: {...},
  destination: {...},
  weight_kg: 5000,
  volume_m3: 10,
  description: 'Carga',
  freight_value: 2500,
  scheduled_date: '2024-02-10T08:00:00Z',
  items: [
    {
      description: 'Item 1',
      quantity: 10,
      weight_kg: 20
    }
  ]
}
```

## 📊 Types para Dashboard

```typescript
import type { DashboardStats, FreightStatusCount } from '@/types'

const stats: DashboardStats = {
  totalFreights: 150,
  activeFreights: 23,
  deliveredFreights: 120,
  totalRevenue: 250000,
  monthlyRevenue: 45000,
  pendingPayments: 5,
  activeVehicles: 12,
  activeDrivers: 8
}
```

## 🎨 ENUMs

### FreightStatus
```typescript
'pending' | 'in_transit' | 'delivered' | 'cancelled'
```

### TransactionType
```typescript
'income' | 'expense'
```

### PaymentStatus
```typescript
'pending' | 'paid' | 'overdue' | 'cancelled'
```

### PaymentMethod
```typescript
'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix' | 'bank_slip'
```

### VehicleStatus
```typescript
'active' | 'maintenance' | 'inactive'
```

### VehicleType
```typescript
'van' | 'truck' | 'semi_truck' | 'motorcycle' | 'car'
```

### UserRole
```typescript
'owner' | 'admin' | 'manager' | 'driver' | 'client'
```

## 🔧 Como Usar

### Em Components
```typescript
import type { Freight, FreightStatus } from '@/types'

export default function FreightCard({ freight }: { freight: Freight }) {
  return (
    <div>
      <h3>{freight.code}</h3>
      <p>Status: {freight.status}</p>
      <p>Valor: R$ {freight.total_value}</p>
    </div>
  )
}
```

### Em API Routes
```typescript
import type { FreightInsert, ApiResponse } from '@/types'

export async function POST(request: Request) {
  const data: FreightInsert = await request.json()
  
  // ... validação e inserção
  
  const response: ApiResponse<Freight> = {
    data: newFreight,
    message: 'Frete criado com sucesso'
  }
  
  return Response.json(response)
}
```

### Com Supabase Client
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Freight } from '@/types'

const supabase = createClient()

const { data, error } = await supabase
  .from('freights')
  .select('*')
  .eq('company_id', companyId)
  .returns<Freight[]>()
```

## 🔄 Regenerar Types

Sempre que alterar o schema no Supabase, regenere os types:

```bash
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## ✅ Boas Práticas

1. **Nunca edite** `database.types.ts` manualmente
2. **Use os types** do `index.ts` nos componentes
3. **Adicione novos types** auxiliares em `index.ts`
4. **Documente** types complexos com comentários
5. **Regenere** os types após mudanças no schema

## 📚 Referências

- [Supabase TypeScript Docs](https://supabase.com/docs/guides/api/generating-types)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
