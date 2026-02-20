-- ============================================================
-- SEED: 10 empresas fictícias + 1 rota de frete cada
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================
-- Teste a cotação após rodar com:
--   Origem: 07115-070 (Guarulhos)
--   Destino: 15500-700 (Recife)
-- ============================================================

-- Habilitar extensão para hash de senha
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  i INT;
  user_id UUID;
  company_id UUID;
  preco_base DECIMAL;
  empresas TEXT[][] := ARRAY[
    ARRAY['TransRápida Log', '11111111000101', 'contato@transrapida-test.com'],
    ARRAY['Frete Brasil Express', '22222222000102', 'contato@fretebrasil-test.com'],
    ARRAY['Carga Segura Transportes', '33333333000103', 'contato@cargasegura-test.com'],
    ARRAY['Rodovia Norte Logística', '44444444000104', 'contato@rodovianorte-test.com'],
    ARRAY['Expresso Sul Cargas', '55555555000105', 'contato@expressosul-test.com'],
    ARRAY['TransNordeste LTDA', '66666666000106', 'contato@transnordeste-test.com'],
    ARRAY['Centro-Oeste Transportes', '77777777000107', 'contato@centrooeste-test.com'],
    ARRAY['Sudeste Cargas Express', '88888888000108', 'contato@sudestecargas-test.com'],
    ARRAY['Logística Total BR', '99999999000109', 'contato@logtotal-test.com'],
    ARRAY['Trans Nacional Frete', '10101010000110', 'contato@transnacional-test.com']
  ];
BEGIN
  FOR i IN 1..10 LOOP
    user_id := gen_random_uuid();

    -- 1. Criar usuário em auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      empresas[i][3],
      crypt('Teste@' || RIGHT(empresas[i][2], 4), gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', empresas[i][1], 'role', 'transportadora')
    );

    -- 2. Criar identidade em auth.identities (necessário para login)
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_id,
      empresas[i][3],
      jsonb_build_object('sub', user_id::text, 'email', empresas[i][3]),
      'email',
      now(),
      now(),
      now()
    );

    -- 3. Criar empresa em companies
    INSERT INTO public.companies (id, name, document, email, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      empresas[i][1],
      empresas[i][2],
      empresas[i][3],
      now(),
      now()
    )
    RETURNING id INTO company_id;

    -- 4. Criar profile (apenas colunas: id, name, company_id, role, email)
    INSERT INTO public.profiles (id, name, company_id, role, email)
    VALUES (user_id, empresas[i][1], company_id, 'transportadora', empresas[i][3])
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      company_id = EXCLUDED.company_id,
      role = EXCLUDED.role,
      email = EXCLUDED.email;

    -- 5. Criar rota de frete
    preco_base := 25 + (i - 1) * 5;
    INSERT INTO public.freight_routes (
      carrier_id,
      origin_zip,
      dest_zip,
      price_per_kg,
      min_price,
      deadline_days,
      rate_card
    ) VALUES (
      user_id,
      '07115-070',
      '15500-700',
      1.1 + (i - 1) * 0.05,
      preco_base,
      4 + ((i - 1) % 3),
      jsonb_build_object(
        'weight_0_30', preco_base,
        'weight_31_50', preco_base + 20,
        'weight_51_70', preco_base + 55,
        'weight_71_100', preco_base + 85,
        'above_101_per_kg', 1.1 + (i - 1) * 0.05,
        'dispatch_fee', 22.5,
        'gris_percent', 0.5,
        'insurance_percent', 0.3,
        'toll_per_100kg', 2.5,
        'icms_percent', 7
      )
    );

    RAISE NOTICE 'Criado: % - 07115-070 -> 15500-700', empresas[i][1];
  END LOOP;

  RAISE NOTICE 'Seed concluido! 10 empresas e rotas criadas.';
  RAISE NOTICE 'Teste a cotacao: Origem 07115-070, Destino 15500-700';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Alguns registros ja existem. Execute o script de limpeza antes ou use o seed TypeScript.';
  WHEN OTHERS THEN
    RAISE;
END $$;
