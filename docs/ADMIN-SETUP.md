# Configuração do Painel Admin

## 1. Executar migrations

```bash
npx supabase db push
# ou
supabase migration up
```

Isso criará a tabela `rntrc_cache` e demais estruturas necessárias.

## 2. Criar o primeiro administrador

Após criar um usuário normalmente (cadastro ou Supabase Auth), promova-o a admin:

```sql
-- No Supabase SQL Editor, execute:
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com');
```

Ou pelo ID do usuário:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'UUID-DO-USUARIO';
```

## 3. Acessar o painel

1. Faça login com o usuário admin
2. Acesse `/admin` ou clique em "Painel Admin" no menu do usuário (avatar)
3. Usuários admin são redirecionados para `/admin` ao tentar acessar `/dashboard`

## 4. Funcionalidades

- **Dashboard:** KPIs (usuários, empresas, carriers, fretes, cache RNTRC)
- **Usuários:** Listagem com busca, filtro por role
- **Empresas:** Listagem com busca
- **Transportadoras:** Listagem carriers com status RNTRC
- **RNTRC:** Upload de CSV da ANTT, histórico de ingestões
- **Auditoria:** Logs de ações (se audit_logs existir)
- **Configurações:** Placeholder para parâmetros futuros

## 5. Upload RNTRC

1. Baixe o CSV de transportadores no [Portal de Dados Abertos ANTT](https://dados.antt.gov.br)
2. Acesse Admin > RNTRC
3. Selecione o arquivo e clique em "Enviar e processar"
4. O cache será populado para consultas rápidas no cadastro
