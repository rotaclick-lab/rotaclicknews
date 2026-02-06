# Migrações Supabase

Esta pasta contém as migrações SQL do banco de dados.

## Criar Nova Migração

```bash
supabase migration new nome_da_migracao
```

## Aplicar Migrações

```bash
supabase db push
```

## Estrutura das Tabelas

- `profiles` - Perfis de usuários
- `customers` - Clientes
- `drivers` - Motoristas
- `vehicles` - Veículos
- `freights` - Fretes
- `marketplace_offers` - Ofertas do marketplace
- `financial_transactions` - Transações financeiras
