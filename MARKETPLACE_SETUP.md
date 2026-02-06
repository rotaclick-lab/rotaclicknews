# Módulo Marketplace - Instruções de Setup

## 📊 Status Atual: 50% Concluído (7/14 arquivos)

### ✅ Arquivos Criados:
1. `src/types/marketplace.types.ts` - Tipos TypeScript
2. `src/lib/validations/marketplace.schema.ts` - Schemas Zod
3. `src/app/actions/return-freight-actions.ts` - Server Actions (Rotas)
4. `src/app/actions/proposal-actions.ts` - Server Actions (Propostas)
5. `src/components/marketplace/proposal-status-badge.tsx` - Badge status proposta
6. `src/components/marketplace/return-freight-status-badge.tsx` - Badge status rota
7. Estrutura base para formulários e páginas

### ⏳ Faltam criar (após SQL):
- 3 componentes de formulário (proposal-card, return-freight-form, proposal-form)
- 6 páginas do marketplace
- 1 componente return-freight-card

---

## 🗄️ PRÓXIMO PASSO: Criar Tabelas no Supabase

Execute estes comandos SQL no Supabase SQL Editor:

### 1️⃣ Tabela: return_freights

\`\`\`sql
-- Tabela de Fretes de Retorno (Rotas Disponíveis)
CREATE TABLE return_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Origem
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL CHECK (length(origin_state) = 2),
  origin_postal_code TEXT,
  
  -- Destino
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL CHECK (length(destination_state) = 2),
  destination_postal_code TEXT,
  
  -- Veículo
  vehicle_type TEXT NOT NULL,
  
  -- Datas
  available_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'in_negotiation', 'accepted', 'expired', 'cancelled')
  ),
  
  -- Preços
  suggested_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  
  -- Carga
  cargo_type TEXT,
  cargo_weight DECIMAL(10, 2),
  cargo_volume DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  
  -- Configurações
  notes TEXT,
  auto_accept_best BOOLEAN DEFAULT FALSE,
  allow_counter_offers BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (available_date < expiry_date),
  CONSTRAINT valid_prices CHECK (
    suggested_price IS NULL OR max_price IS NULL OR suggested_price <= max_price
  )
);

-- Índices para performance
CREATE INDEX idx_return_freights_company ON return_freights(company_id);
CREATE INDEX idx_return_freights_status ON return_freights(status);
CREATE INDEX idx_return_freights_dates ON return_freights(available_date, expiry_date);
CREATE INDEX idx_return_freights_origin ON return_freights(origin_state, origin_city);
CREATE INDEX idx_return_freights_destination ON return_freights(destination_state, destination_city);
CREATE INDEX idx_return_freights_vehicle_type ON return_freights(vehicle_type);

-- Trigger para updated_at
CREATE TRIGGER update_return_freights_updated_at
  BEFORE UPDATE ON return_freights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE return_freights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view all return freights"
  ON return_freights FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their company's return freights"
  ON return_freights FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's return freights"
  ON return_freights FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's return freights"
  ON return_freights FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
\`\`\`

### 2️⃣ Tabela: proposals

\`\`\`sql
-- Tabela de Propostas para Fretes de Retorno
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_freight_id UUID NOT NULL REFERENCES return_freights(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  
  -- Proposta
  proposed_price DECIMAL(10, 2) NOT NULL CHECK (proposed_price > 0),
  estimated_delivery_days INTEGER NOT NULL CHECK (estimated_delivery_days > 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'counter', 'withdrawn')
  ),
  
  -- Detalhes
  message TEXT,
  valid_until DATE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_valid_until CHECK (valid_until >= CURRENT_DATE),
  CONSTRAINT no_self_proposal CHECK (
    company_id != (
      SELECT company_id FROM return_freights WHERE id = return_freight_id
    )
  )
);

-- Índices para performance
CREATE INDEX idx_proposals_return_freight ON proposals(return_freight_id);
CREATE INDEX idx_proposals_company ON proposals(company_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_price ON proposals(proposed_price);

-- Trigger para updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view proposals for their return freights or their own proposals"
  ON proposals FOR SELECT
  USING (
    return_freight_id IN (
      SELECT id FROM return_freights 
      WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert proposals for other companies' return freights"
  ON proposals FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND return_freight_id IN (
      SELECT id FROM return_freights 
      WHERE company_id NOT IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND status IN ('available', 'in_negotiation')
    )
  );

CREATE POLICY "Users can update their own proposals"
  ON proposals FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Return freight owners can update proposals"
  ON proposals FOR UPDATE
  USING (
    return_freight_id IN (
      SELECT id FROM return_freights 
      WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
\`\`\`

### 3️⃣ Função auxiliar (se ainda não existir):

\`\`\`sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## 🚀 Após criar as tabelas SQL:

Execute este comando para gerar os tipos TypeScript do Supabase:

\`\`\`bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
\`\`\`

Depois, me avise para continuar criando os 7 arquivos restantes! 🎉

---

## 📋 Checklist:

- [ ] Executar SQL para criar tabela \`return_freights\`
- [ ] Executar SQL para criar tabela \`proposals\`
- [ ] Verificar se as tabelas foram criadas no Supabase Dashboard
- [ ] Gerar tipos TypeScript (\`supabase gen types\`)
- [ ] Avisar para continuar com os arquivos restantes

---

**Total de linhas SQL:** ~200 linhas
**Tempo estimado:** 5 minutos

---

## ℹ️ Informações Adicionais:

### Campos importantes:

**return_freights:**
- \`status\`: available, in_negotiation, accepted, expired, cancelled
- \`auto_accept_best\`: Se true, aceita automaticamente a melhor proposta
- \`allow_counter_offers\`: Se false, não permite contra-propostas

**proposals:**
- \`status\`: pending, accepted, rejected, counter, withdrawn
- Constraint \`no_self_proposal\`: Impede empresa fazer proposta para própria rota
- \`valid_until\`: Data limite para aceitação da proposta

### RLS (Row Level Security):
- ✅ Qualquer usuário pode **ver** todos os fretes de retorno
- ✅ Usuários só podem **criar/editar/deletar** fretes da própria empresa
- ✅ Usuários podem **ver** propostas dos seus fretes OU suas próprias propostas
- ✅ Usuários só podem fazer propostas para fretes de **outras empresas**
