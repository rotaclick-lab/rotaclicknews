# 📋 Reformulação Completa do Cadastro de Transportadora

## 🎯 Objetivo
Capturar o máximo de dados estratégicos desde o primeiro contato, com formulário multi-step progressivo e não exaustivo.

## ✅ Implementação Completa

### 1. **Migrations SQL**

#### `database/enhance_carrier_registration.sql`
- ✅ Tabela `term_acceptances` com versionamento completo
- ✅ Tabela `term_versions` para controle de versões de termos
- ✅ Novas colunas em `profiles`:
  - CPF (validado)
  - Telefone celular
  - Permissão WhatsApp
  - Aceites de comunicações e análise de crédito
- ✅ Novas colunas em `companies`:
  - Todos os dados da Receita Federal (razão social, CNAE, natureza jurídica, porte, capital social, sócios, etc.)
  - Inscrição Estadual
  - RNTRC
  - Tipo de veículo e carroceria
  - Capacidade de carga
  - Regiões de atendimento
  - Raio de atuação
  - Dados opcionais (consumo diesel, eixos, rastreamento, seguro)
- ✅ Função `validate_cpf` no PostgreSQL
- ✅ Constraints para validação de dados
- ✅ Índices otimizados
- ✅ RLS policies

#### `database/update_profile_trigger_enhanced.sql`
- ✅ Trigger atualizado para processar TODOS os novos campos
- ✅ Criação automática de companies com dados completos
- ✅ Criação automática de profiles com dados pessoais

### 2. **Schemas de Validação**

#### `src/lib/validations/carrier-registration.schema.ts`
- ✅ 3 schemas separados por etapa (Step 1, 2, 3)
- ✅ Schema completo unificado
- ✅ Validação de CPF com dígitos verificadores
- ✅ Validação de telefone celular brasileiro
- ✅ Constantes para dropdowns (19 campos)

### 3. **Máscaras e Utilitários**

#### `src/lib/utils/masks.ts`
- ✅ Máscaras: CPF, CNPJ, telefone, CEP, IE (por UF), RNTRC
- ✅ Validações: CPF, CNPJ, telefone, email
- ✅ Funções auxiliares: removeMask, formatCurrency, maskDecimal

### 4. **Server Actions**

#### `src/app/actions/carrier-registration-actions.ts`
- ✅ `registerCarrier`: Registro completo com todos os dados
- ✅ Criação de usuário no Supabase Auth
- ✅ Registro de aceites de termos com versionamento
- ✅ Atualização de profiles e companies
- ✅ `getCurrentTermVersion`: Buscar versão atual de termos
- ✅ `hasAcceptedTerm`: Verificar aceite de termos

#### `src/app/actions/cnpj-actions.ts` (Atualizado)
- ✅ Retorna TODOS os dados da Receita Federal
- ✅ Dados completos: CNAEs, sócios, endereço, natureza jurídica, porte, capital social

### 5. **Componentes**

#### `src/components/auth/carrier-registration-form.tsx`
- ✅ Formulário multi-step com 3 etapas
- ✅ Tabs com indicadores visuais de progresso
- ✅ Validação em tempo real com react-hook-form
- ✅ Máscaras aplicadas automaticamente
- ✅ Todos os 19 campos implementados

**Etapa 1: Dados Pessoais e Empresa**
- Nome completo
- CPF (com validação)
- Telefone celular (com validação)
- Permissão WhatsApp
- Nome da empresa
- CNPJ (preenchido automaticamente)
- Inscrição Estadual
- RNTRC

**Etapa 2: Dados Operacionais**
- Tipo de veículo principal (dropdown)
- Tipo de carroceria principal (dropdown)
- Capacidade de carga (toneladas)
- Regiões de atendimento (checkboxes)
- Raio de atuação (dropdown)
- Consumo médio diesel (opcional)
- Número de eixos (opcional)
- Possui rastreamento (checkbox)
- Possui seguro de carga (checkbox)
- Número de apólice (opcional)

**Etapa 3: Credenciais e Aceites**
- Email
- Senha (com requisitos de segurança)
- Confirmar senha
- Aceite de termos de uso (obrigatório, versionado)
- Aceite de política de privacidade (obrigatório, versionado)
- Aceite de comunicações (opcional)
- Aceite de análise de crédito (opcional)

#### `src/app/(auth)/registro-transportadora/page.tsx` (Atualizado)
- ✅ Armazena TODOS os dados da Receita Federal no sessionStorage
- ✅ Exibe informações completas da empresa validada

## 📊 Campos Implementados

### Obrigatórios (9)
1. ✅ CPF do responsável
2. ✅ Telefone celular
3. ✅ Inscrição Estadual
4. ✅ RNTRC
5. ✅ Tipo de veículo principal
6. ✅ Tipo de carroceria principal
7. ✅ Capacidade de carga (toneladas)
8. ✅ Regiões de atendimento
9. ✅ Raio de atuação

### Opcionais (5)
10. ✅ Consumo médio de diesel
11. ✅ Número de eixos
12. ✅ Possui rastreamento
13. ✅ Possui seguro de carga
14. ✅ Número de apólice

### Compliance (5)
15. ✅ Aceite de termos (versionado)
16. ✅ Aceite de privacidade (versionado)
17. ✅ Aceite de comunicações
18. ✅ Aceite de análise de crédito
19. ✅ Permissão WhatsApp

**Total: 19 campos novos + estrutura completa de versionamento**

## 🚀 Próximos Passos para Deploy

### 1. Executar Migrations no Supabase
```sql
-- Executar em ordem:
1. database/enhance_carrier_registration.sql
2. database/update_profile_trigger_enhanced.sql
```

### 2. Atualizar Página de Registro
- Substituir `src/components/auth/register-form.tsx` por `carrier-registration-form.tsx`
- Ou criar rota específica `/registro-transportadora-completo`

### 3. Testar Fluxo Completo
1. Validar CNPJ em `/registro-transportadora`
2. Preencher formulário multi-step
3. Verificar criação de:
   - Usuário no Auth
   - Profile com todos os dados
   - Company com dados completos
   - Aceites de termos registrados

### 4. Commit e Deploy
```bash
git add .
git commit -m "feat: Reformulação completa do cadastro de transportadora com 19 campos estratégicos"
git push origin main
```

## 📝 Notas Técnicas

### Validações Implementadas
- CPF: Validação de dígitos verificadores (client e server)
- Telefone: Formato brasileiro com DDD + 9 dígitos
- CNPJ: Validação na Receita Federal
- RNTRC: 8 a 12 dígitos
- Inscrição Estadual: Formato por UF

### Versionamento de Termos
- Cada aceite registra: user_id, term_type, term_version, timestamp, IP, user_agent
- Permite auditoria completa de aceites
- Suporta atualização de termos sem perder histórico

### Performance
- Índices criados em todas as colunas de busca
- RLS policies para segurança
- Constraints para integridade de dados

## 🎨 UX/UI
- Formulário dividido em 3 etapas claras
- Indicadores visuais de progresso
- Validação em tempo real
- Máscaras automáticas
- Feedback imediato de erros
- Design responsivo

## 🔒 Segurança
- Validação client-side e server-side
- RLS policies no Supabase
- Versionamento de aceites de termos
- Auditoria completa de registros
- Validação de CPF no PostgreSQL
