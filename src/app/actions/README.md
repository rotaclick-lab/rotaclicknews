# Server Actions

Esta pasta contém todas as Server Actions do Next.js.

## Estrutura

- `auth.ts` - Actions de autenticação
- `freight.ts` - Actions de fretes
- `customer.ts` - Actions de clientes
- `driver.ts` - Actions de motoristas
- `vehicle.ts` - Actions de veículos
- `financial.ts` - Actions financeiras

## Exemplo

```typescript
'use server'

export async function createFreight(formData: FormData) {
  // Validação
  // Chamada ao Supabase
  // Retorno
}
```
