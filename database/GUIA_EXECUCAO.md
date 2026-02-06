# 🚀 GUIA RÁPIDO: EXECUTAR SCRIPT SQL NO SUPABASE

## 📍 Localização do Arquivo
```
C:\ROTACLICK\rotaclicknews\database\create_missing_tables.sql
```

## ✅ INSTRUÇÕES PASSO A PASSO

### 1️⃣ Abrir o Arquivo
- Vá para a pasta: `C:\ROTACLICK\rotaclicknews\database`
- Abra o arquivo: `create_missing_tables.sql` (clique duplo)
- Ou abra pelo VS Code Explorer

### 2️⃣ Copiar o Conteúdo
- Pressione `Ctrl + A` (selecionar tudo)
- Pressione `Ctrl + C` (copiar)

### 3️⃣ Acessar o Supabase
**Link direto para SQL Editor:**
```
https://supabase.com/dashboard/project/_/sql/new
```

**Ou navegue manualmente:**
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto RotaClick
4. Clique em "SQL Editor" no menu lateral
5. Clique em "New query"

### 4️⃣ Colar e Executar
1. Cole o script no editor (Ctrl + V)
2. Clique no botão **"Run"** (▶)
3. Ou pressione: `Ctrl + Enter`
4. Aguarde 10-30 segundos

### 5️⃣ Verificar Resultado
**Mensagem de sucesso esperada:**
```
✅ Todas as tabelas foram criadas com sucesso!
```

**Verificar tabelas criadas:**
1. Vá em "Table Editor" no menu lateral
2. Você deve ver 3 novas tabelas:
   - `notifications`
   - `audit_logs`
   - `notification_preferences`

---

## 📊 O QUE SERÁ CRIADO

### Tabelas (3)
- ✅ `notifications` - Sistema de notificações
- ✅ `audit_logs` - Logs de auditoria
- ✅ `notification_preferences` - Preferências do usuário

### Índices (10)
- Performance otimizada para queries

### Triggers (3)
- Atualizações automáticas (updated_at)
- Criação de preferências padrão

### Views (3)
- `unread_notifications_count`
- `audit_stats_last_30_days`
- `suspicious_login_activity`

### Funções (2)
- `create_notification()` - Helper para criar notificações
- `cleanup_old_audit_logs()` - Limpeza de logs antigos

### Segurança
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Permissions configuradas
- ✅ Compliance LGPD

---

## ⚠️ IMPORTANTE

- Execute o script **UMA ÚNICA VEZ**
- Se já executou antes, não há problema (usa `IF NOT EXISTS`)
- Não há risco de duplicação

---

## ❓ TROUBLESHOOTING

### Se encontrar erro:
1. Copie a mensagem de erro completa
2. Verifique se tem a tabela `companies` criada
3. Verifique se tem a tabela `profiles` criada
4. Me envie o erro para análise

### Erros comuns:
- **"relation 'companies' does not exist"** 
  → Precisa criar a tabela companies primeiro
  
- **"relation 'profiles' does not exist"**
  → Precisa criar a tabela profiles primeiro

---

## 🎯 APÓS EXECUTAR COM SUCESSO

Me avise para:
1. ✅ Testar o sistema de notificações
2. ✅ Testar o sistema de auditoria
3. ✅ Verificar se tudo está funcionando
4. ✅ Fazer o deploy final

---

## 📞 PRECISA DE AJUDA?

Se encontrar qualquer problema:
- Copie o erro completo
- Me envie
- Vou ajustar o script se necessário

---

**Data de criação:** Fevereiro 2026  
**Versão:** RotaClick v1.2  
**Arquivo:** create_missing_tables.sql (380 linhas)
