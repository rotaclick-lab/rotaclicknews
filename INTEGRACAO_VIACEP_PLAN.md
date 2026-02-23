# Plano de Integração ViaCEP - RotaClick

## Objetivo
Integrar API ViaCEP em toda a plataforma para autocompletar endereços e validar CEPs.

## Locais Identificados para Integração

### 1. ✅ API de Cotação (JÁ FEITO)
- **Arquivo:** `src/app/api/quotes/calculate/route.ts`
- **Função:** Sistema de regiões de entrega
- **Status:** ✅ Integrado com ViaCEP para fallback

### 2. 📝 Formulário de Registro de Transportadora
- **Arquivo:** `src/app/registro/page.tsx`
- **Campos CEP:** `postal_code` (endereço da empresa)
- **Ação:** Autocompletar cidade, estado, logradouro

### 3. 📝 Formulário de Cotação (Frontend)
- **Arquivo:** Provavelmente em `src/app/` ou `src/components/`
- **Campos CEP:** Origem e Destino
- **Ação:** Validar CEPs e mostrar cidade/estado

### 4. 📝 Perfil do Usuário
- **Arquivo:** Provavelmente `src/app/(dashboard)/perfil/`
- **Campos CEP:** Endereço do usuário
- **Ação:** Autocompletar endereço

### 5. 📝 Formulários de Endereço em Geral
- **Arquivos:** Vários componentes de formulário
- **Ação:** Padronizar autocompletar de CEP

## Implementações Necessárias

### 1. Hook React para Autocomplete de CEP
```typescript
// src/hooks/useViaCEP.ts
export function useViaCEP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const buscarEndereco = async (cep: string) => {
    // Implementar busca ViaCEP
  }
  
  return { buscarEndereco, loading, error }
}
```

### 2. Componente de Input CEP
```typescript
// src/components/ui/cep-input.tsx
export function CepInput({ onAddressFound, ...props }) {
  // Componente com autocomplete ViaCEP
}
```

### 3. Atualizar Validações
- **Arquivo:** `src/lib/utils.ts` (função `formatCEP`)
- **Arquivo:** `src/lib/constants.ts` (constante `CEP_LENGTH`)
- Adicionar validação ViaCEP

### 4. Server Actions com Validação ViaCEP
- Validar CEPs no backend
- Autocompletar endereços em cadastros

## Benefícios

1. **UX Melhorada:** Autocompletar endereços
2. **Validação:** CEPs válidos apenas
3. **Consistência:** Dados padronizados
4. **Cobertura:** Todo o Brasil

## Próximos Passos

1. **Criar hook `useViaCEP`**
2. **Criar componente `CepInput`**
3. **Atualizar formulário de registro**
4. **Atualizar formulário de cotação**
5. **Atualizar perfil do usuário**
6. **Adicionar validações backend**

## Prioridade

1. **Alta:** Formulário de registro (impacto direto)
2. **Alta:** Formulário de cotação (UX principal)
3. **Média:** Perfil do usuário
4. **Baixa:** Outros formulários
