# Solução: Redirecionamento da Tabela de Frete

## Problema Identificado

Ao clicar no botão "Tabela de Frete" no dashboard, o usuário era redirecionado de volta para `/dashboard` ao invés de acessar a página `/tabela-frete`.

## Causa Raiz

A rota `/tabela-frete` possui um `RoleGuard` que verifica se o usuário tem a role `"transportadora"` na tabela `profiles` do banco de dados. O problema ocorria porque:

1. **Faltava trigger no banco de dados** para criar automaticamente o registro na tabela `profiles` quando um usuário se registrava
2. **A função signup não incluía a role** nos metadados do usuário
3. **Usuários existentes não tinham a role correta** configurada no banco

### Fluxo do Problema

```
Usuário clica em "Tabela de Frete"
    ↓
RoleGuard verifica role na tabela profiles
    ↓
Se role !== "transportadora"
    ↓
Redireciona para /dashboard ❌
```

## Solução Implementada

### 1. Trigger no Banco de Dados ✅

**Arquivo:** `database/create_profile_trigger.sql`

Criado trigger `on_auth_user_created_profile` que:
- Detecta quando um novo usuário é criado
- Lê a role dos metadados (`raw_user_meta_data`)
- Se role = "transportadora":
  - Cria empresa na tabela `companies`
  - Cria profile vinculado à empresa com role "transportadora"
- Se role diferente:
  - Cria profile sem empresa

### 2. Atualização da Função Signup ✅

**Arquivo:** `src/app/actions/auth-actions.ts`

Modificado para incluir `role: 'transportadora'` nos metadados do usuário durante o registro.

### 3. Script de Correção para Usuários Existentes ✅

**Arquivo:** `database/fix_existing_users_role.sql`

Script SQL para:
- Verificar usuários sem profile ou com role incorreta
- Atualizar role para "transportadora" em usuários com CNPJ
- Criar profiles faltantes

## Passos para Aplicar a Solução

### Passo 1: Executar Trigger no Supabase

1. Acesse o **Supabase SQL Editor**
2. Execute o arquivo `database/create_profile_trigger.sql`
3. Verifique se o trigger foi criado com sucesso

### Passo 2: Corrigir Usuários Existentes

1. No **Supabase SQL Editor**, execute `database/fix_existing_users_role.sql`
2. Isso irá:
   - Atualizar a role de todos os usuários transportadora existentes
   - Criar profiles faltantes

### Passo 3: Deploy do Código Atualizado

O código já foi atualizado em `src/app/actions/auth-actions.ts`. Para aplicar:

```bash
# Commit e push para o GitHub
git add .
git commit -m "fix: adicionar role transportadora no signup"
git push origin main
```

A Vercel fará o deploy automático.

### Passo 4: Verificar Correção

Execute no Supabase SQL Editor:

```sql
-- Verificar se seu usuário tem a role correta
SELECT id, name, email, role, company_id 
FROM profiles 
WHERE email = 'SEU_EMAIL_AQUI';
```

Resultado esperado:
```
role: "transportadora"
company_id: [UUID da empresa]
```

## Teste da Solução

1. Faça login na plataforma
2. Clique em "Tabela de Frete" no menu lateral
3. A página `/tabela-frete` deve carregar corretamente ✅

## Arquivos Modificados

- ✅ `src/app/actions/auth-actions.ts` - Adicionada role no signup
- ✅ `database/create_profile_trigger.sql` - Novo trigger
- ✅ `database/fix_existing_users_role.sql` - Script de correção

## Estrutura de Roles

O sistema agora suporta duas dashboards separadas:

| Role | Dashboard | Acesso |
|------|-----------|--------|
| `transportadora` | Dashboard Transportadora | `/dashboard`, `/tabela-frete`, etc. |
| `user` ou `cliente` | Dashboard Cliente | `/dashboard` (versão cliente) |

## Prevenção de Problemas Futuros

✅ Novos usuários transportadora terão automaticamente:
- Profile criado via trigger
- Role "transportadora" configurada
- Empresa vinculada

✅ O RoleGuard continuará protegendo rotas específicas por tipo de usuário
