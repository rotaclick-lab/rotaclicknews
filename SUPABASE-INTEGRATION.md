# 🔐 Integração Supabase - RotaClick

## ✅ Arquivos Criados/Atualizados

### 1. Client-side (`src/lib/supabase/client.ts`)
**Uso:** Client Components (componentes com 'use client')

```typescript
import { createClient } from '@/lib/supabase/client'

// Exemplo de uso
const supabase = createClient()
const { data, error } = await supabase.from('table').select()
```

### 2. Server-side (`src/lib/supabase/server.ts`)
**Uso:** Server Components, Server Actions, Route Handlers

```typescript
import { createClient } from '@/lib/supabase/server'

// Exemplo de uso
const supabase = await createClient()
const { data, error } = await supabase.from('table').select()
```

### 3. Middleware (`middleware.ts`)
**Funcionalidade:**
- ✅ Refresh automático da sessão do usuário
- ✅ Proteção de rotas do dashboard (requer autenticação)
- ✅ Redirecionamento de usuários autenticados das páginas de login/registro

**Rotas Protegidas:**
- `/dashboard/*` - Requer autenticação
- Se não autenticado → redireciona para `/login`

**Rotas Restritas para Autenticados:**
- `/login` - Redireciona para `/dashboard` se já autenticado
- `/registro` - Redireciona para `/dashboard` se já autenticado

### 4. Auth Helpers (`src/lib/supabase/auth-helpers.ts`)
**Funções auxiliares para autenticação:**

```typescript
import { getSession, getUser, requireAuth } from '@/lib/supabase/auth-helpers'

// Obter sessão atual
const session = await getSession()

// Obter usuário atual
const user = await getUser()

// Requer autenticação (lança erro se não autenticado)
const user = await requireAuth()
```

## 🔧 Configuração

### Variáveis de Ambiente
Certifique-se de que estas variáveis estão configuradas no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rfkbvuvbukizayzclofr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0avtr-jOkwUw5qb3PkquGA_rA0plxa2
```

## 📋 Exemplos de Uso

### Client Component (Login)
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) console.error(error)
  }

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  )
}
```

### Server Component (Dashboard)
```typescript
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'

export default async function DashboardPage() {
  // Garante que o usuário está autenticado
  const user = await requireAuth()
  
  // Busca dados
  const supabase = await createClient()
  const { data: freights } = await supabase
    .from('freights')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div>
      <h1>Dashboard de {user.email}</h1>
      {/* render freights */}
    </div>
  )
}
```

### Server Action
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFreight(formData: FormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('freights')
    .insert({
      title: formData.get('title'),
      // ... outros campos
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/fretes')
  return { data }
}
```

## 🔒 Fluxo de Autenticação

### Login
1. Usuário acessa `/login`
2. Preenche credenciais
3. `supabase.auth.signInWithPassword()`
4. Middleware detecta sessão
5. Redireciona para `/dashboard`

### Logout
```typescript
const supabase = createClient()
await supabase.auth.signOut()
// Redirecionar para /login
```

### Registro
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
})
```

## 🛡️ Segurança

### Row Level Security (RLS)
Configure políticas no Supabase para garantir que:
- Usuários só podem ver/editar seus próprios dados
- Exemplo de política:

```sql
-- Política de SELECT para fretes
CREATE POLICY "Users can view own freights"
ON freights FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT para fretes
CREATE POLICY "Users can insert own freights"
ON freights FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## 📊 Status da Integração

- ✅ Client criado
- ✅ Server client criado
- ✅ Middleware configurado
- ✅ Auth helpers criados
- ✅ Proteção de rotas implementada
- ✅ Redirecionamentos configurados

## 🎯 Próximos Passos

1. ✅ Criar páginas de Login
2. ✅ Criar páginas de Registro
3. ✅ Criar callback de autenticação (`/auth/callback`)
4. ✅ Implementar logout
5. ✅ Configurar RLS no Supabase
6. ✅ Criar schema do banco de dados

---

**Data:** 06/02/2026  
**Status:** ✅ Integração Completa
