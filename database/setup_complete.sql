-- ============================================
-- ROTACLICK - CRIAR EMPRESA E DADOS DE TESTE
-- Script completo: cria empresa + dados de teste
-- Database: PostgreSQL (Supabase)
-- ============================================

-- ============================================
-- PASSO 1: CRIAR EMPRESA
-- ============================================

INSERT INTO companies (
  name,
  document,
  cnpj,
  email,
  phone,
  city,
  state,
  postal_code
) VALUES (
  'Transportadora RotaClick',
  '12.345.678/0001-90',
  '12.345.678/0001-90',
  'contato@rotaclick.com',
  '(11) 3000-0000',
  'São Paulo',
  'SP',
  '01310-100'
) RETURNING id, name, cnpj;

-- ============================================
-- PASSO 2: INSERIR CLIENTES
-- ============================================

-- Cliente Pessoa Jurídica
INSERT INTO customers (
  company_id,
  name,
  type,
  cpf_cnpj,
  email,
  phone,
  mobile,
  address,
  city,
  state,
  postal_code,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Transportadora ABC Ltda',
  'company',
  '23.456.789/0001-01',
  'contato@transportadoraabc.com',
  '(11) 3456-7890',
  '(11) 98765-4321',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'active'
) RETURNING id, name, type, cpf_cnpj;

-- Cliente Pessoa Física
INSERT INTO customers (
  company_id,
  name,
  type,
  cpf_cnpj,
  email,
  phone,
  city,
  state,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Maria Santos',
  'individual',
  '987.654.321-00',
  'maria.santos@email.com',
  '(21) 99876-5432',
  'Rio de Janeiro',
  'RJ',
  'active'
) RETURNING id, name, type, cpf_cnpj;

-- Cliente Inativo
INSERT INTO customers (
  company_id,
  name,
  type,
  cpf_cnpj,
  email,
  city,
  state,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Empresa Desativada Ltda',
  'company',
  '11.222.333/0001-44',
  'desativada@email.com',
  'Curitiba',
  'PR',
  'inactive'
) RETURNING id, name, status;

-- ============================================
-- PASSO 3: INSERIR MOTORISTAS
-- ============================================

-- Motorista Ativo
INSERT INTO drivers (
  company_id,
  name,
  cpf,
  birth_date,
  email,
  phone,
  mobile,
  address,
  city,
  state,
  postal_code,
  cnh_number,
  cnh_category,
  cnh_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'João da Silva',
  '123.456.789-00',
  '1985-05-15',
  'joao.silva@email.com',
  '(11) 91234-5678',
  '(11) 91234-5678',
  'Rua dos Motoristas, 456',
  'São Paulo',
  'SP',
  '01234-567',
  '12345678900',
  'E',
  CURRENT_DATE + INTERVAL '2 years',
  'active'
) RETURNING id, name, cpf, cnh_number, status;

-- Motorista com CNH vencendo
INSERT INTO drivers (
  company_id,
  name,
  cpf,
  email,
  phone,
  cnh_number,
  cnh_category,
  cnh_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Pedro Oliveira',
  '234.567.890-11',
  'pedro.oliveira@email.com',
  '(11) 92345-6789',
  '23456789011',
  'D',
  CURRENT_DATE + INTERVAL '30 days',
  'active'
) RETURNING id, name, cnh_expiry_date;

-- Motorista de férias
INSERT INTO drivers (
  company_id,
  name,
  cpf,
  email,
  phone,
  cnh_number,
  cnh_category,
  cnh_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Carlos Souza',
  '345.678.901-22',
  'carlos.souza@email.com',
  '(11) 93456-7890',
  '34567890122',
  'E',
  CURRENT_DATE + INTERVAL '1 year',
  'on_leave'
) RETURNING id, name, status;

-- ============================================
-- PASSO 4: INSERIR VEÍCULOS
-- ============================================

-- Caminhão Ativo
INSERT INTO vehicles (
  company_id,
  plate,
  model,
  brand,
  year,
  color,
  type,
  capacity_kg,
  capacity_m3,
  renavam,
  crlv_expiry_date,
  inspection_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'ABC-1234',
  'Scania R450',
  'Scania',
  2022,
  'Branco',
  'truck',
  25000.00,
  80.00,
  '12345678901',
  CURRENT_DATE + INTERVAL '1 year',
  CURRENT_DATE + INTERVAL '6 months',
  'active'
) RETURNING id, plate, model, type, status;

-- Van Ativa
INSERT INTO vehicles (
  company_id,
  plate,
  model,
  brand,
  year,
  color,
  type,
  capacity_kg,
  capacity_m3,
  crlv_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'DEF-5678',
  'Sprinter 415',
  'Mercedes-Benz',
  2021,
  'Branco',
  'van',
  3500.00,
  15.00,
  CURRENT_DATE + INTERVAL '8 months',
  'active'
) RETURNING id, plate, model, type, status;

-- Veículo em Manutenção
INSERT INTO vehicles (
  company_id,
  plate,
  model,
  brand,
  year,
  type,
  capacity_kg,
  crlv_expiry_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'GHI-9012',
  'Volvo FH 540',
  'Volvo',
  2020,
  'truck',
  28000.00,
  CURRENT_DATE + INTERVAL '1 year',
  'maintenance'
) RETURNING id, plate, model, status;

-- ============================================
-- PASSO 5: INSERIR FRETES
-- ============================================

-- Frete Pendente
INSERT INTO freights (
  company_id,
  customer_id,
  driver_id,
  vehicle_id,
  origin_city,
  origin_state,
  destination_city,
  destination_state,
  cargo_type,
  cargo_weight,
  cargo_value,
  distance_km,
  freight_value,
  pickup_date,
  delivery_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM customers WHERE cpf_cnpj = '23.456.789/0001-01' LIMIT 1),
  (SELECT id FROM drivers WHERE cpf = '123.456.789-00' LIMIT 1),
  (SELECT id FROM vehicles WHERE plate = 'ABC-1234' LIMIT 1),
  'São Paulo',
  'SP',
  'Rio de Janeiro',
  'RJ',
  'Eletrônicos',
  5000.00,
  150000.00,
  450.00,
  3500.00,
  CURRENT_DATE + INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '5 days',
  'pending'
) RETURNING id, origin_city, destination_city, freight_value, status;

-- Frete Confirmado
INSERT INTO freights (
  company_id,
  customer_id,
  driver_id,
  vehicle_id,
  origin_city,
  origin_state,
  destination_city,
  destination_state,
  cargo_type,
  cargo_weight,
  distance_km,
  freight_value,
  pickup_date,
  delivery_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM customers WHERE cpf_cnpj = '987.654.321-00' LIMIT 1),
  (SELECT id FROM drivers WHERE cpf = '234.567.890-11' LIMIT 1),
  (SELECT id FROM vehicles WHERE plate = 'DEF-5678' LIMIT 1),
  'Curitiba',
  'PR',
  'Porto Alegre',
  'RS',
  'Alimentos',
  2500.00,
  700.00,
  4200.00,
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '3 days',
  'confirmed'
) RETURNING id, origin_city, destination_city, freight_value, status;

-- Frete Em Trânsito
INSERT INTO freights (
  company_id,
  customer_id,
  origin_city,
  origin_state,
  destination_city,
  destination_state,
  cargo_type,
  freight_value,
  pickup_date,
  delivery_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM customers WHERE cpf_cnpj = '23.456.789/0001-01' LIMIT 1),
  'Belo Horizonte',
  'MG',
  'Salvador',
  'BA',
  'Móveis',
  5800.00,
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '2 days',
  'in_transit'
) RETURNING id, origin_city, destination_city, status;

-- ============================================
-- PASSO 6: INSERIR TRANSAÇÕES
-- ============================================

-- Receita Paga (Frete)
INSERT INTO transactions (
  company_id,
  category_id,
  freight_id,
  type,
  description,
  amount,
  due_date,
  payment_date,
  status,
  payment_method
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM categories WHERE name = 'Frete' AND type = 'income' LIMIT 1),
  (SELECT id FROM freights WHERE status = 'in_transit' LIMIT 1),
  'income',
  'Pagamento Frete BH → Salvador',
  5800.00,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE - INTERVAL '3 days',
  'paid',
  'pix'
) RETURNING id, description, amount, status;

-- Despesa Paga (Combustível)
INSERT INTO transactions (
  company_id,
  category_id,
  type,
  description,
  amount,
  due_date,
  payment_date,
  status,
  payment_method
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM categories WHERE name = 'Combustível' AND type = 'expense' LIMIT 1),
  'expense',
  'Abastecimento Posto BR',
  850.00,
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE - INTERVAL '2 days',
  'paid',
  'credit_card'
) RETURNING id, description, amount, status;

-- Despesa Pendente (Manutenção)
INSERT INTO transactions (
  company_id,
  category_id,
  type,
  description,
  amount,
  due_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM categories WHERE name = 'Manutenção' AND type = 'expense' LIMIT 1),
  'expense',
  'Revisão Preventiva Scania',
  2500.00,
  CURRENT_DATE + INTERVAL '5 days',
  'pending'
) RETURNING id, description, amount, due_date, status;

-- Receita Pendente (Frete Futuro)
INSERT INTO transactions (
  company_id,
  category_id,
  freight_id,
  type,
  description,
  amount,
  due_date,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM categories WHERE name = 'Frete' AND type = 'income' LIMIT 1),
  (SELECT id FROM freights WHERE status = 'confirmed' LIMIT 1),
  'income',
  'Pagamento Frete Curitiba → POA',
  4200.00,
  CURRENT_DATE + INTERVAL '7 days',
  'pending'
) RETURNING id, description, amount, due_date, status;

-- ============================================
-- PASSO 7: INSERIR ROTAS DO MARKETPLACE
-- ============================================

-- Rota Disponível
INSERT INTO marketplace_routes (
  company_id,
  driver_id,
  vehicle_id,
  origin_city,
  origin_state,
  destination_city,
  destination_state,
  available_date,
  available_weight,
  available_volume,
  suggested_price,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM drivers WHERE cpf = '123.456.789-00' LIMIT 1),
  (SELECT id FROM vehicles WHERE plate = 'ABC-1234' LIMIT 1),
  'Brasília',
  'DF',
  'Goiânia',
  'GO',
  CURRENT_DATE + INTERVAL '10 days',
  15000.00,
  50.00,
  1800.00,
  'available'
) RETURNING id, origin_city, destination_city, available_date, suggested_price;

-- ============================================
-- PASSO 8: VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  v_company_id UUID;
  customers_count INT;
  drivers_count INT;
  vehicles_count INT;
  freights_count INT;
  transactions_count INT;
  routes_count INT;
  categories_count INT;
BEGIN
  -- Pegar company_id
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  -- Contar registros
  SELECT COUNT(*) INTO customers_count FROM customers WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO drivers_count FROM drivers WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO vehicles_count FROM vehicles WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO freights_count FROM freights WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO transactions_count FROM transactions WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO routes_count FROM marketplace_routes WHERE company_id = v_company_id;
  SELECT COUNT(*) INTO categories_count FROM categories WHERE company_id = v_company_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ DADOS DE TESTE INSERIDOS COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO:';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '   Company ID: %', v_company_id;
  RAISE NOTICE '   Empresa: Transportadora RotaClick';
  RAISE NOTICE '';
  RAISE NOTICE '   Clientes: %', customers_count;
  RAISE NOTICE '   Motoristas: %', drivers_count;
  RAISE NOTICE '   Veículos: %', vehicles_count;
  RAISE NOTICE '   Fretes: %', freights_count;
  RAISE NOTICE '   Transações: %', transactions_count;
  RAISE NOTICE '   Rotas Marketplace: %', routes_count;
  RAISE NOTICE '   Categorias: %', categories_count;
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Sistema pronto para uso!';
  RAISE NOTICE '';
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
