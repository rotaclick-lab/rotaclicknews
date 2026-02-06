# 🔐 Guia de Autenticação - RotaClick

## 📋 Páginas Disponíveis

### 1. Login (`/login`)
```
┌─────────────────────────────────┐
│      🚛 RotaClick              │
│                                 │
│  Entre com suas credenciais    │
│                                 │
│  Email: [__________________]   │
│  Senha: [__________________]   │
│                                 │
│  [     Entrar     ]            │
│                                 │
│  Esqueceu sua senha?           │
│  Não tem conta? Cadastre-se    │
└─────────────────────────────────┘
```

### 2. Registro (`/registro`)
```
┌─────────────────────────────────┐
│      🚛 RotaClick              │
│                                 │
│  Crie sua conta                │
│                                 │
│  Nome: [__________________]    │
│  Email: [__________________]   │
│  Empresa: [______________]     │
│  CNPJ: [__________________]    │
│  Senha: [__________________]   │
│  Confirmar: [______________]   │
│                                 │
│  ☐ Aceito os termos            │
│                                 │
│  [  Criar conta  ]             │
│                                 │
│  Já tem conta? Faça login      │
└─────────────────────────────────┘
```

### 3. Esqueci Senha (`/esqueci-senha`)
```
┌─────────────────────────────────┐
│   Esqueceu sua senha?          │
│                                 │
│  Digite seu email              │
│                                 │
│  Email: [__________________]   │
│                                 │
│  [Enviar email de recuperação] │
│                                 │
│  ← Voltar para o login         │
└─────────────────────────────────┘
```

## 🚀 Como Testar

### 1. Iniciar o servidor
```bash
npm run dev
```

### 2. Acessar as páginas
- Login: http://localhost:3000/login
- Registro: http://localhost:3000/registro
- Esqueci senha: http://localhost:3000/esqueci-senha

### 3. Testar fluxo de registro
```bash
# 1. Acesse /registro
# 2. Preencha:
Nome: João Silva
Email: joao@teste.com
Empresa: Transportadora ABC
CNPJ: 12345678000190 (14 dígitos)
Senha: Senha123 (8 chars + maiúscula + número)
Confirmar: Senha123
☑ Aceito os termos

# 3. Clique em "Criar conta"
# 4. Será redirecionado para /dashboard
```

### 4. Testar fluxo de login
```bash
# 1. Acesse /login
# 2. Use as credenciais criadas:
Email: joao@teste.com
Senha: Senha123

# 3. Clique em "Entrar"
# 4. Será redirecionado para /dashboard
```

### 5. Testar recuperação de senha
```bash
# 1. Acesse /esqueci-senha
# 2. Digite o email cadastrado
# 3. Clique em "Enviar email"
# 4. Verifique a caixa de entrada (Supabase envia email)
```

## 🎯 Validações

### Login
- ✅ Email deve ser válido
- ✅ Senha mínimo 6 caracteres

### Registro
- ✅ Nome mínimo 3 caracteres
- ✅ Email válido
- ✅ Empresa mínimo 3 caracteres
- ✅ CNPJ exatamente 14 dígitos numéricos
- ✅ Senha mínimo 8 chars + maiúscula + número
- ✅ Senhas devem coincidir
- ✅ Termos devem ser aceitos

### Exemplos de Senhas Válidas
- ✅ `Senha123`
- ✅ `MinhaSenh@1`
- ✅ `Transport2024`
- ❌ `senha123` (sem maiúscula)
- ❌ `SENHA` (sem número)
- ❌ `Pass1` (menos de 8 chars)

## 🔧 Troubleshooting

### Erro: "Email já cadastrado"
- Use outro email ou faça login

### Erro: "CNPJ inválido"
- Digite apenas números (sem pontos ou traços)
- Deve ter exatamente 14 dígitos
- Exemplo: `12345678000190`

### Erro: "Senha fraca"
- Mínimo 8 caracteres
- Pelo menos 1 maiúscula
- Pelo menos 1 número

### Email não chegou
1. Verifique spam/lixo eletrônico
2. Confirme que o email está correto
3. Aguarde alguns minutos
4. No Supabase Dashboard, veja os logs de email

## 📊 Dados Salvos no Registro

Quando um usuário se registra, os seguintes dados são salvos:

### Na tabela `auth.users` (Supabase Auth)
```json
{
  "id": "uuid",
  "email": "joao@teste.com",
  "raw_user_meta_data": {
    "full_name": "João Silva",
    "company_name": "Transportadora ABC",
    "cnpj": "12345678000190"
  }
}
```

### Na tabela `public.users` (via trigger)
```json
{
  "id": "uuid (mesmo do auth.users)",
  "email": "joao@teste.com",
  "full_name": "João Silva",
  "role": "owner",
  "company_id": null,
  "is_active": true
}
```

### ⚠️ Próximo Passo
Após registro, é necessário:
1. Criar a empresa na tabela `companies`
2. Associar o usuário à empresa (`company_id`)
3. Criar perfil inicial

(Isso será implementado no onboarding)

## 🎨 Customização

### Alterar cores do gradient
```tsx
// src/app/(auth)/layout.tsx
<div className="bg-gradient-to-br from-blue-50 to-indigo-100">
  {/* Altere as cores aqui */}
</div>
```

### Alterar logo
```tsx
// src/app/(auth)/login/page.tsx
<CardTitle className="text-2xl font-bold">
  🚛 RotaClick  {/* Altere o emoji aqui */}
</CardTitle>
```

### Adicionar reCAPTCHA
```tsx
// src/components/auth/register-form.tsx
// Adicione antes do botão de submit:
<ReCAPTCHA
  sitekey="YOUR_SITE_KEY"
  onChange={handleCaptchaChange}
/>
```

## 🔒 Segurança

### Proteção Implementada
- ✅ Validação no frontend (Zod)
- ✅ Validação no backend (Supabase)
- ✅ Hash de senhas (Supabase)
- ✅ Rate limiting (Supabase)
- ✅ CSRF protection (Next.js)
- ✅ XSS prevention (React)

### Boas Práticas
- ✅ Senhas nunca são expostas
- ✅ Tokens são httpOnly cookies
- ✅ HTTPS em produção
- ✅ Email verification (opcional)
- ✅ Password reset seguro

## 📱 Telas

### Desktop
- Cards centralizados
- Max-width: 448px
- Espaçamento generoso

### Mobile
- Full-width com padding
- Touch-friendly
- Botões grandes

## ✅ Próximos Passos

Após autenticação, implemente:

1. **Dashboard** - Página inicial após login
2. **Onboarding** - Criar empresa e configurações iniciais
3. **Profile** - Editar perfil do usuário
4. **Email Verification** - Confirmar email
5. **2FA** - Autenticação de dois fatores (opcional)

## 🎉 Conclusão

Sistema de autenticação completo com:
- ✅ 3 páginas (login, registro, recuperação)
- ✅ Validação forte de senhas
- ✅ Integração Supabase
- ✅ Toast notifications
- ✅ Loading states
- ✅ Responsive design

**Pronto para adicionar usuários ao RotaClick!** 🚀
