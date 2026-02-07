# 📚 GUIA COMPLETO - SCRIPTS SQL DO ROTACLICK

**Data:** 07/02/2026  
**Status:** 🔧 Correções aplicadas

---

## 📁 ARQUIVOS SQL DISPONÍVEIS:

### **1. Scripts de Criação:**
- ✅ `create_main_tables.sql` - Cria as 8 tabelas principais
- ⚠️ `create_missing_tables.sql` - (Antigo, não usar)

### **2. Scripts de Verificação:**
- ✅ `check_all.sql` - Verifica tudo no banco (NOVO)
- ✅ `diagnostic.sql` - Diagnóstico de configuração
- ⚠️ `verify_database.sql` - (Antigo, substituído por check_all.sql)

### **3. Scripts de Dados:**
- ✅ `insert_test_data.sql` - Insere dados de teste

### **4. Scripts de Manutenção:**
- ✅ `cleanup_duplicates.sql` - Remove tabelas duplicadas (NOVO)
- ✅ `GUIA_EXECUCAO_TABELAS.md` - Guia de execução

---

## 🚀 ORDEM DE EXECUÇÃO CORRETA:

### **CENÁRIO 1: Banco vazio (primeira vez)**

```
1. create_main_tables.sql       → Cria 8 tabelas principais
2. check_all.sql                 → Verifica se tudo foi criado
3. diagnostic.sql                → Verifica configuração do usuário
4. insert_test_data.sql          → Insere dados de teste
```

### **CENÁRIO 2: Banco com problemas (limpeza)**

```
1. cleanup_duplicates.sql        → Remove tabelas duplicadas
2. check_all.sql                 → Verifica o que falta
3. create_main_tables.sql        → Recria tabelas faltantes
4. diagnostic.sql                → Verifica configuração
5. insert_test_data.sql          → Insere dados de teste
```

### **CENÁRIO 3: Já tem tudo criado**

```
1. check_all.sql                 → Verifica status atual
2. diagnostic.sql                → Verifica configuração do usuário
3. insert_test_data.sql          → Insere dados de teste
```

---

## 📊 TABELAS DO SISTEMA:

### **Tabelas Principais (8):**
1. ✅ `customers` - Clientes (PF/PJ)
2. ✅ `drivers` - Motoristas
3. ✅ `vehicles` - Veículos
4. ✅ `freights` - Fretes
5. ✅ `categories` - Categorias financeiras
6. ✅ `transactions` - Transações financeiras
7. ✅ `marketplace_routes` - Rotas do marketplace
8. ✅ `marketplace_proposals` - Propostas do marketplace

### **Tabelas de Sistema (5):**
9. ✅ `companies` - Empresas
10. ✅ `profiles` - Perfis de usuários
11. ✅ `notifications` - Notificações
12. ✅ `notification_preferences` - Preferências de notificação
13. ✅ `audit_logs` - Logs de auditoria

### **Tabelas Duplicadas (REMOVER):**
- ❌ `financial_transactions` → Substituído por `transactions`
- ❌ `marketplace_offers` → Substituído por `marketplace_proposals`
- ❌ `users` → Substituído por `profiles`

---

## 🔍 PROBLEMAS IDENTIFICADOS E CORRIGIDOS:

### **Problema 1: Tabelas Duplicadas**
**Sintoma:**
```
- financial_transactions e transactions
- marketplace_offers e marketplace_proposals
- users e profiles
```

**Solução:**
```sql
Execute: cleanup_duplicates.sql
```

**Status:** ✅ Script criado

---

### **Problema 2: Coluna inexistente**
**Sintoma:**
```
ERROR: column p.full_name does not exist
```

**Solução:**
```
Removido full_name de diagnostic.sql
```

**Status:** ✅ Corrigido

---

### **Problema 3: company_id NULL**
**Sintoma:**
```
ERROR: null value in column "company_id"
```

**Causa:**
- Usuário não está logado no Supabase
- Profile não tem company_id preenchido

**Solução:**
```sql
Execute: diagnostic.sql
Siga as instruções de correção
```

**Status:** ✅ Script criado

---

### **Problema 4: Ordem de criação incorreta**
**Sintoma:**
```
ERROR: relation "customers" does not exist
```

**Causa:**
- Tabela freights criada antes de customers

**Solução:**
```
Ordem correta já aplicada em create_main_tables.sql:
1. customers
2. drivers  
3. vehicles
4. freights (depende das 3 anteriores)
```

**Status:** ✅ Corrigido

---

## 📝 CHECKLIST FINAL:

### **Antes de Publicar:**

- [ ] **1. Limpar duplicatas**
  ```
  Execute: cleanup_duplicates.sql
  ```

- [ ] **2. Verificar tudo**
  ```
  Execute: check_all.sql
  ```

- [ ] **3. Verificar configuração**
  ```
  Execute: diagnostic.sql
  ```

- [ ] **4. Inserir dados de teste**
  ```
  Execute: insert_test_data.sql
  ```

- [ ] **5. Confirmar no dashboard**
  ```
  - Abrir Supabase Dashboard
  - Verificar Table Editor
  - Confirmar 13 tabelas
  - Confirmar ~45 policies
  ```

---

## 🎯 PRÓXIMOS PASSOS:

### **1. AGORA:**
Execute os 4 scripts na ordem:
1. `cleanup_duplicates.sql`
2. `check_all.sql`
3. `diagnostic.sql`
4. `insert_test_data.sql`

### **2. DEPOIS:**
Publicar no GitHub:
```bash
git add database/
git commit -m "fix: Organiza e corrige scripts SQL"
git push
```

### **3. FINAL:**
Testar no frontend:
- Login no sistema
- Criar um frete
- Criar um cliente
- Verificar categorias padrão

---

## 📞 SUPORTE:

Se ainda houver problemas:

1. **Execute:** `check_all.sql` para diagnóstico completo
2. **Tire print** do erro exato
3. **Verifique** qual linha está falhando
4. **Confira** se está usando o script mais recente

---

## 🎉 RESUMO:

```
✅ 4 scripts criados/corrigidos
✅ 3 tabelas duplicadas identificadas
✅ 4 problemas resolvidos
✅ Ordem de execução definida
✅ Checklist criado
✅ Pronto para publicar!
```

---

**Última atualização:** 07/02/2026  
**Status:** 🟢 Scripts corrigidos - Pronto para executar
