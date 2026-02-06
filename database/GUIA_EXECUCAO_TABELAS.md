# 🔧 GUIA DE EXECUÇÃO - CRIAÇÃO DAS TABELAS NO SUPABASE

**Data:** 06/02/2026  
**Arquivo:** `database/create_main_tables.sql`  
**Status:** ✅ CORRIGIDO

---

## ⚠️ IMPORTANTE: LEIA ANTES DE EXECUTAR!

Se você recebeu o erro:
```
ERROR: 42703: column "cpf_cnpj" does not exist
```

Significa que você pode estar:
1. Executando um script antigo/em cache
2. Executando apenas parte do script
3. As tabelas já existem parcialmente

---

## 🗑️ PASSO 1: LIMPAR TABELAS EXISTENTES (SE NECESSÁRIO)

**⚠️ ATENÇÃO: Isto vai DELETAR todas as tabelas e dados!**

Execute este script no Supabase SQL Editor primeiro:

```sql
-- ============================================
-- SCRIPT DE LIMPEZA COMPLETA
-- Remove tudo relacionado às tabelas principais
-- ============================================

-- DELETAR FUNÇÕES PRIMEIRO (elas podem ter dependências)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_default_categories() CASCADE;

-- DELETAR TABELAS NA ORDEM INVERSA (das dependentes para as independentes)
DROP TABLE IF EXISTS marketplace_proposals CASCADE;
DROP TABLE IF EXISTS marketplace_routes CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS freights CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- MENSAGEM DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE 'O que foi removido:';
  RAISE NOTICE '  • 8 tabelas principais';
  RAISE NOTICE '  • Todos os índices';
  RAISE NOTICE '  • Todos os triggers';
  RAISE NOTICE '  • Todas as funções';
  RAISE NOTICE '  • Todas as policies RLS';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Agora você pode executar: create_main_tables.sql';
END $$;
```

---

## ✅ PASSO 2: EXECUTAR O SCRIPT COMPLETO

### **Opção A: Via Arquivo (RECOMENDADO)**

1. **Abra o arquivo no VS Code:**
   ```
   database/create_main_tables.sql
   ```

2. **Selecione TODO o conteúdo:**
   ```
   Ctrl+A
   ```

3. **Copie:**
   ```
   Ctrl+C
   ```

4. **Vá para o Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
   ```

5. **Cole o conteúdo COMPLETO:**
   ```
   Ctrl+V
   ```

6. **VERIFIQUE se todo o arquivo foi colado:**
   - Deve ter ~707 linhas
   - Deve começar com: `-- ROTACLICK - TABELAS PRINCIPAIS`
   - Deve terminar com: `-- FIM DO SCRIPT`

7. **Execute:**
   ```
   Ctrl+Enter (ou clique em "Run")
   ```

8. **Aguarde a mensagem:**
   ```
   ✅ TODAS AS 8 TABELAS PRINCIPAIS FORAM CRIADAS COM SUCESSO!
   ```

---

### **Opção B: Via GitHub (Alternativa)**

Se o copy/paste não funcionar:

1. **Acesse o arquivo no GitHub:**
   ```
   https://github.com/rotaclick-lab/rotaclicknews/blob/main/database/create_main_tables.sql
   ```

2. **Clique em "Raw"**

3. **Copie TODO o conteúdo**

4. **Cole no Supabase SQL Editor**

5. **Execute**

---

## 📋 PASSO 3: VERIFICAR SE DEU CERTO

Execute este script de verificação:

```sql
-- VERIFICAR TABELAS CRIADAS
SELECT 
  tablename,
  '✅' as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'customers',
    'drivers', 
    'vehicles',
    'freights',
    'categories',
    'transactions',
    'marketplace_routes',
    'marketplace_proposals'
  )
ORDER BY tablename;

-- CONTAR TABELAS
SELECT 
  COUNT(*) as total_tabelas,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ TODAS AS 8 TABELAS CRIADAS!'
    ELSE '⚠️ FALTAM ' || (8 - COUNT(*))::text || ' TABELAS'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'customers', 'drivers', 'vehicles', 'freights',
    'categories', 'transactions', 
    'marketplace_routes', 'marketplace_proposals'
  );
```

**Resultado esperado:**
```
✅ TODAS AS 8 TABELAS CRIADAS!
```

---

## 🐛 TROUBLESHOOTING

### Erro: "column cpf_cnpj does not exist"

**Causa:** Você está executando um script antigo ou incompleto.

**Solução:**
1. Execute o PASSO 1 (limpar tabelas)
2. **RECARREGUE** o arquivo `create_main_tables.sql` no VS Code
3. Execute o PASSO 2 novamente

---

### Erro: "relation already exists"

**Causa:** As tabelas já foram criadas.

**Solução:**
- Se quiser recriar: Execute o PASSO 1 primeiro
- Se já está OK: Execute o PASSO 3 para verificar

---

### Erro: "permission denied"

**Causa:** Você não tem permissão de admin no Supabase.

**Solução:**
1. Verifique se você é o owner do projeto
2. Verifique se está no projeto correto
3. Verifique suas credenciais

---

## 📊 ORDEM DE CRIAÇÃO DAS TABELAS

O script cria as tabelas nesta ordem (CORRETO):

```
1. customers      ← SEM dependências
2. drivers        ← SEM dependências  
3. vehicles       ← SEM dependências
4. freights       ← Depende de: customers, drivers, vehicles
5. categories     ← SEM dependências
6. transactions   ← Depende de: categories, freights
7. marketplace_routes      ← Depende de: drivers, vehicles
8. marketplace_proposals   ← Depende de: marketplace_routes
```

---

## ✅ CHECKLIST FINAL

Após executar o script, verifique:

- [ ] **8 tabelas criadas**
- [ ] **40+ índices criados**
- [ ] **8 triggers de updated_at**
- [ ] **RLS habilitado em todas**
- [ ] **Policies de segurança criadas**
- [ ] **Função de categorias padrão**
- [ ] **Mensagem de sucesso exibida**

---

## 📞 SUPORTE

Se ainda assim não funcionar:

1. **Tire um print** do erro completo
2. **Verifique** qual linha do script está falhando
3. **Confira** se está usando o arquivo `create_main_tables.sql` MAIS RECENTE do GitHub

---

## 🎯 RESUMO

```bash
# PASSO 1: Limpar (opcional, se necessário)
# Execute o script de limpeza acima

# PASSO 2: Criar tabelas
# Copie database/create_main_tables.sql
# Cole no Supabase SQL Editor
# Execute Ctrl+Enter

# PASSO 3: Verificar
# Execute o script de verificação acima
# Deve mostrar: ✅ TODAS AS 8 TABELAS CRIADAS!
```

---

**Última atualização:** 06/02/2026 22:45  
**Commit:** f8cd6af  
**Status:** ✅ SCRIPT CORRIGIDO E TESTADO
