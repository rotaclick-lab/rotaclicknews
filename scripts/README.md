# Scripts

## seed:freight

Cria 10 empresas fictícias e 1 rota de frete cada para testar o sistema de cotação.

### Opção 1: SQL (Supabase SQL Editor)

1. Abra **Supabase Dashboard** → **SQL Editor**
2. Cole o conteúdo de `seed-freight-test-data.sql`
3. Clique em **Run**

### Opção 2: TypeScript (terminal)

```bash
pnpm run seed:freight
```

**Requisitos:** `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

---

**Após executar**, teste a cotação com:
- **Origem:** 07115-070 (Guarulhos)
- **Destino:** 15500-700 (Recife)
- **Peso:** qualquer valor > 0
