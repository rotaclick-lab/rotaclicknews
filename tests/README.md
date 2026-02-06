# Testes

Esta pasta contém todos os testes da aplicação.

## Estrutura

- `unit/` - Testes unitários de funções e componentes isolados
- `integration/` - Testes de integração entre módulos
- `e2e/` - Testes end-to-end da aplicação completa

## Rodar Testes

```bash
# Todos os testes
npm run test

# Com interface
npm run test:ui

# Coverage
npm run test -- --coverage
```

## Exemplo de Teste

```typescript
import { describe, it, expect } from 'vitest'
import { calculateFreight } from '@/lib/services/freight'

describe('calculateFreight', () => {
  it('should calculate freight correctly', () => {
    const result = calculateFreight(100, 1000)
    expect(result).toBeGreaterThan(0)
  })
})
```
