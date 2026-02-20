# ✅ CHECKLIST DE DEPLOY - rotaclick.com.br

## PRÉ-DEPLOY

### Código
- [ ] Todos os arquivos commitados
- [ ] Build local funciona: `npm run build`
- [ ] Sem erros TypeScript: `npm run type-check` (se tiver)
- [ ] Testes passando (se tiver)

### Configurações
- [ ] `.env.production.example` criado com instruções
- [ ] `.env.local` não commitado (em .gitignore)
- [ ] `DEPLOY.md` revisado

---

## SUPABASE

### Authentication
- [ ] Site URL: `https://rotaclick.com.br`
- [ ] Redirect URLs configuradas:
  - [ ] `https://rotaclick.com.br/auth/callback`
  - [ ] `https://rotaclick.com.br/auth/reset-password`
  - [ ] `https://rotaclick.com.br/login`
  - [ ] `https://rotaclick.com.br/dashboard`
- [ ] Email templates atualizados com URL produção
- [ ] Confirm email habilitado: `Settings > Auth > Email Auth`

### Database
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies testadas
- [ ] Migrations aplicadas
- [ ] Triggers funcionando:
  - [ ] `updated_at`
  - [ ] `handle_new_user`
  - [ ] `generate_freight_code`

### Segurança
- [ ] Service Role Key **NÃO** exposta no código frontend
- [ ] Apenas Anon Key no `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] RLS testado com diferentes usuários

---

## VERCEL

### Projeto
- [ ] Repositório conectado ao GitHub
- [ ] Framework: Next.js selecionado
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### Environment Variables
Marcar todas como: **Production, Preview, Development**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NODE_ENV=production`

Opcionais:
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `RESEND_API_KEY`

### Domínio
- [ ] `rotaclick.com.br` adicionado
- [ ] Marcado como **Primary Domain**
- [ ] `www.rotaclick.com.br` configurado (redirect)
- [ ] SSL/HTTPS configurado (automático)

---

## DNS

No provedor de domínio (Registro.br, etc):

- [ ] Registro CNAME criado:
  ```
  Tipo: CNAME
  Nome: @
  Valor: cname.vercel-dns.com
  ```
- [ ] Registro CNAME para www:
  ```
  Tipo: CNAME
  Nome: www
  Valor: cname.vercel-dns.com
  ```
- [ ] Aguardar propagação (2-4h)
- [ ] Verificar em: https://dnschecker.org

---

## DEPLOY

- [ ] Push para GitHub:
  ```bash
  git add .
  git commit -m "feat: deploy produção rotaclick.com.br"
  git push origin main
  ```
- [ ] Deploy iniciado na Vercel
- [ ] Build bem-sucedido (verificar logs)
- [ ] Preview URL funciona
- [ ] Production URL funciona

---

## TESTES PÓS-DEPLOY

### Navegação
- [ ] Homepage: https://rotaclick.com.br
- [ ] Página de login: https://rotaclick.com.br/login
- [ ] Página de registro: https://rotaclick.com.br/registro
- [ ] Página de esqueci senha: https://rotaclick.com.br/esqueci-senha

### Autenticação
- [ ] Criar nova conta
- [ ] Receber email de confirmação
- [ ] Confirmar email (clicar no link)
- [ ] Fazer login com conta confirmada
- [ ] Acessar dashboard
- [ ] Dashboard carrega stats do Supabase
- [ ] Sidebar funciona (desktop)
- [ ] Mobile menu funciona (mobile)
- [ ] Logout funciona
- [ ] Redirect após logout

### Proteção de Rotas
- [ ] Acessar `/dashboard` sem login → redireciona para `/login`
- [ ] Acessar `/login` logado → redireciona para `/dashboard`
- [ ] Middleware funciona corretamente

### Performance
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Imagens otimizadas (Next.js Image)

### SEO
- [ ] Meta tags presentes (title, description)
- [ ] Open Graph tags configuradas
- [ ] Sitemap.xml (se criado)
- [ ] robots.txt (se criado)

### Mobile
- [ ] Responsivo em celular
- [ ] Menu mobile funciona
- [ ] Formulários funcionam no mobile
- [ ] Sidebar colapsa em telas pequenas

### SSL/HTTPS
- [ ] Certificado SSL ativo
- [ ] HTTP redireciona para HTTPS
- [ ] Sem warnings de conteúdo misto
- [ ] Cadeado verde no navegador

---

## MONITORAMENTO

### Configurar (Recomendado)
- [ ] Vercel Analytics habilitado
- [ ] Sentry para error tracking (opcional)
- [ ] Uptime monitor (UptimeRobot, etc)
- [ ] Google Analytics (opcional)

### Verificar Logs
- [ ] Vercel > Deployments > Function Logs
- [ ] Supabase > Logs > Realtime
- [ ] Sem erros críticos

---

## BACKUP

- [ ] Backup do schema Supabase:
  ```bash
  npx supabase db dump --db-url "..." > backup-schema.sql
  ```
- [ ] Backup dos dados:
  ```bash
  npx supabase db dump --db-url "..." --data-only > backup-data.sql
  ```
- [ ] Backup das environment variables (arquivo seguro local)
- [ ] Documentação atualizada

---

## COMUNICAÇÃO

### Interno
- [ ] Time notificado sobre deploy
- [ ] Documentação compartilhada
- [ ] Credenciais de acesso distribuídas (com segurança)

### Clientes/Usuários
- [ ] Email de lançamento preparado (se aplicável)
- [ ] Página de status criada (se aplicável)
- [ ] Suporte disponível

---

## PÓS-DEPLOY (Primeiras 24h)

### Monitoramento Ativo
- [ ] Verificar erros nos logs (cada 2h)
- [ ] Monitorar performance
- [ ] Responder feedback de usuários
- [ ] Verificar emails chegando

### Ajustes Rápidos
- [ ] Hotfixes para bugs críticos
- [ ] Ajustes de performance se necessário
- [ ] Correções de UX

---

## PRÓXIMOS PASSOS

### Semana 1
- [ ] Coletar feedback dos primeiros usuários
- [ ] Ajustar com base no feedback
- [ ] Adicionar analytics e métricas
- [ ] Documentar issues conhecidas

### Mês 1
- [ ] Implementar features prioritárias:
  - [ ] Google Maps integration
  - [ ] Sistema de pagamentos
  - [ ] Notificações por email
  - [ ] Relatórios PDF
- [ ] Otimizações de performance
- [ ] SEO avançado
- [ ] Marketing inicial

---

## 🎉 DEPLOY COMPLETO!

**URL Produção:** https://rotaclick.com.br

**Data do Deploy:** _____________

**Responsável:** _____________

**Status:** 
- [ ] ✅ Tudo funcionando
- [ ] ⚠️ Issues menores identificadas
- [ ] ❌ Rollback necessário

**Notas:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## CONTATOS IMPORTANTES

**Vercel Support:** https://vercel.com/support
**Supabase Support:** https://supabase.com/support
**Registro.br:** https://registro.br

**Developer:** _______________
**Email:** _______________
**Telefone:** _______________
