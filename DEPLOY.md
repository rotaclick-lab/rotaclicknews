# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO - rotaclick.com.br

## 📋 PRÉ-REQUISITOS

- [x] Conta na Vercel (https://vercel.com)
- [x] Conta no Supabase (https://supabase.com)
- [x] Domínio registrado: rotaclick.com.br
- [x] Repositório no GitHub

---

## 1️⃣ CONFIGURAÇÃO NO SUPABASE

### 1.1 URLs de Autenticação

Acesse: **Supabase Dashboard > Authentication > URL Configuration**

```
Site URL: https://rotaclick.com.br

Redirect URLs (adicionar todas):
- https://rotaclick.com.br/auth/callback
- https://rotaclick.com.br/login
- https://rotaclick.com.br/dashboard
- http://localhost:3000/auth/callback (para desenvolvimento)
```

### 1.2 Templates de Email

Acesse: **Authentication > Email Templates**

Atualize todos os templates para usar:
- `{{ .SiteURL }}` → https://rotaclick.com.br

### 1.3 Verificar RLS Policies

Acesse: **Database > Policies**

Confirme que todas as tabelas têm RLS habilitado:
- ✅ companies
- ✅ users
- ✅ drivers
- ✅ vehicles
- ✅ customers
- ✅ freights
- ✅ freight_items
- ✅ marketplace_offers
- ✅ financial_transactions
- ✅ freight_tracking

---

## 2️⃣ CONFIGURAÇÃO NA VERCEL

### 2.1 Importar Repositório

1. Acesse https://vercel.com/new
2. Conecte seu GitHub
3. Selecione o repositório: `rotaclick-lab/rotaclicknews`
4. Configure o projeto:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.2 Adicionar Variáveis de Ambiente

Acesse: **Settings > Environment Variables**

Adicione as seguintes variáveis (marcar: Production, Preview, Development):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rfkbvuvbukizayzclofr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# URLs
NEXT_PUBLIC_SITE_URL=https://rotaclick.com.br
NEXT_PUBLIC_APP_URL=https://rotaclick.com.br
NEXT_PUBLIC_APP_NAME=RotaClick
NODE_ENV=production

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_google_maps_key

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_sua_key
STRIPE_SECRET_KEY=sk_live_sua_key
STRIPE_WEBHOOK_SECRET=whsec_sua_key

# Email (opcional)
RESEND_API_KEY=re_sua_key
```

### 2.3 Configurar Domínio

Acesse: **Settings > Domains**

1. Adicionar domínio principal:
   - **rotaclick.com.br** → marcar como Primary

2. Adicionar subdomínio www:
   - **www.rotaclick.com.br** → Redirect to rotaclick.com.br

A Vercel fornecerá os valores para configurar no DNS.

---

## 3️⃣ CONFIGURAÇÃO DE DNS

### No seu provedor de domínio (Registro.br, GoDaddy, etc):

#### Opção 1: CNAME (Recomendado)
```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com
TTL: 3600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600
```

#### Opção 2: A Record (Alternativa)
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 3600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600
```

**⏱️ Propagação DNS:** Pode levar de 1h a 48h (geralmente 2-4h)

---

## 4️⃣ DEPLOY

### Via GitHub (Automático - Recomendado)

```bash
# 1. Commit das alterações
git add .
git commit -m "feat: configuração para produção rotaclick.com.br"

# 2. Push para GitHub
git push origin main

# 3. Vercel fará deploy automático
```

### Via Vercel CLI (Manual)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

---

## 5️⃣ VERIFICAÇÕES PÓS-DEPLOY

### ✅ Checklist de Testes

Após o deploy, teste:

- [ ] **Homepage:** https://rotaclick.com.br
- [ ] **Login:** https://rotaclick.com.br/login
- [ ] **Registro:** https://rotaclick.com.br/registro
- [ ] **Criar conta** → Verificar email de confirmação
- [ ] **Confirmar email** → Link deve redirecionar corretamente
- [ ] **Fazer login** → Deve acessar /dashboard
- [ ] **Dashboard** → Verificar se carrega stats do Supabase
- [ ] **Logout** → Deve redirecionar para /login
- [ ] **Acesso sem login a /dashboard** → Deve redirecionar para /login
- [ ] **SSL/HTTPS** → Certificado ativo (automático pela Vercel)
- [ ] **www redirect** → www.rotaclick.com.br → rotaclick.com.br

### 🔍 Verificar Logs

**Vercel Dashboard:**
- Deployments > Latest Deployment > View Function Logs
- Verificar erros de runtime

**Supabase Dashboard:**
- Auth > Users → Verificar novos cadastros
- Logs > Realtime → Ver queries sendo executadas

---

## 6️⃣ MONITORAMENTO

### Vercel Analytics (Recomendado)

Acesse: **Analytics > Overview**
- Ative: Speed Insights
- Ative: Web Analytics

### Uptime Monitoring (Opcional)

Ferramentas gratuitas:
- https://uptimerobot.com
- https://betteruptime.com
- https://cronitor.io

Configurar para monitorar:
- https://rotaclick.com.br (HTTP 200)
- https://rotaclick.com.br/api/health (se criar endpoint)

---

## 7️⃣ BACKUP E SEGURANÇA

### Backup do Supabase

**Automático:**
- Supabase faz backup diário automático (retenção de 7 dias no plano gratuito)

**Manual (recomendado para produção):**
```bash
# Exportar schema
npx supabase db dump --db-url "postgresql://..." > backup-schema.sql

# Exportar dados
npx supabase db dump --db-url "postgresql://..." --data-only > backup-data.sql
```

### Segurança

- ✅ RLS Policies habilitadas
- ✅ HTTPS automático pela Vercel
- ✅ Environment variables protegidas
- ✅ Anon Key é segura para client-side
- ⚠️ **NUNCA** expor Service Role Key no frontend

---

## 8️⃣ CUSTOS ESTIMADOS (Mensal)

### Plano Gratuito (Inicial)
```
Vercel (Hobby):         GRÁTIS
Supabase (Free):        GRÁTIS
Domínio (.com.br):      R$ 40/ano
Total:                  ~R$ 3,33/mês
```

### Plano Produção (Crescimento)
```
Vercel (Pro):           $20/mês (~R$ 100)
Supabase (Pro):         $25/mês (~R$ 125)
Domínio (.com.br):      R$ 40/ano
Total:                  ~R$ 228/mês
```

---

## 9️⃣ PRÓXIMOS PASSOS

Após deploy em produção:

1. **Marketing:**
   - Configurar Google Analytics
   - Criar página no Facebook/Instagram
   - Configurar Google My Business

2. **SEO:**
   - Adicionar sitemap.xml
   - Configurar meta tags
   - Google Search Console

3. **Features:**
   - Integração com Google Maps
   - Sistema de pagamentos (Stripe)
   - Notificações por email (Resend)
   - Relatórios PDF
   - Aplicativo mobile (React Native/Expo)

---

## 🆘 TROUBLESHOOTING

### Erro: "Site URL is not configured"
**Solução:** Configurar Site URL no Supabase Auth Settings

### Erro: "Invalid redirect URL"
**Solução:** Adicionar URL em Supabase > Auth > Redirect URLs

### Erro: 404 após deploy
**Solução:** Verificar se build foi bem-sucedido nos logs da Vercel

### DNS não propaga
**Solução:** Aguardar 2-4h. Verificar com: https://dnschecker.org

### SSL não ativa
**Solução:** Aguardar propagação DNS. Vercel ativa SSL automaticamente após DNS propagar

---

## 📞 SUPORTE

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **Next.js:** https://nextjs.org/docs

---

## 🎉 PARABÉNS!

Seu sistema está no ar em **rotaclick.com.br**! 🚀

Para atualizações futuras, basta fazer push no GitHub que a Vercel fará deploy automático.
