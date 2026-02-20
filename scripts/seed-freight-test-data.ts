/**
 * Seed: 10 empresas fictícias + 1 rota de frete cada
 *
 * Execute: pnpm run seed:freight
 * Ou: npx tsx scripts/seed-freight-test-data.ts
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMPRESAS = [
  { nome: 'TransRápida Log', cnpj: '11111111000101', email: 'contato@transrapida-test.com' },
  { nome: 'Frete Brasil Express', cnpj: '22222222000102', email: 'contato@fretebrasil-test.com' },
  { nome: 'Carga Segura Transportes', cnpj: '33333333000103', email: 'contato@cargasegura-test.com' },
  { nome: 'Rodovia Norte Logística', cnpj: '44444444000104', email: 'contato@rodovianorte-test.com' },
  { nome: 'Expresso Sul Cargas', cnpj: '55555555000105', email: 'contato@expressosul-test.com' },
  { nome: 'TransNordeste LTDA', cnpj: '66666666000106', email: 'contato@transnordeste-test.com' },
  { nome: 'Centro-Oeste Transportes', cnpj: '77777777000107', email: 'contato@centrooeste-test.com' },
  { nome: 'Sudeste Cargas Express', cnpj: '88888888000108', email: 'contato@sudestecargas-test.com' },
  { nome: 'Logística Total BR', cnpj: '99999999000109', email: 'contato@logtotal-test.com' },
  { nome: 'Trans Nacional Frete', cnpj: '10101010000110', email: 'contato@transnacional-test.com' },
]

// Par de CEPs para teste (Guarulhos -> Recife - do exemplo da tabela)
const ORIGEM_CEP = '07115-070'
const DESTINO_CEP = '15500-700'

async function main() {
  console.log('🚀 Criando 10 empresas fictícias e rotas de frete para teste...\n')

  let created = 0
  let skipped = 0

  for (let i = 0; i < EMPRESAS.length; i++) {
    const emp = EMPRESAS[i]
    const senha = `Teste@${emp.cnpj.slice(-4)}`

    const { data: user, error: userError } = await admin.auth.admin.createUser({
      email: emp.email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: emp.nome,
        role: 'transportadora',
      },
    })

    if (userError) {
      if (userError.message?.includes('already been registered')) {
        console.log(`⏭️  ${emp.nome}: usuário já existe, pulando`)
        skipped++
        continue
      }
      console.log(`⚠️  ${emp.nome}: erro ao criar usuário - ${userError.message}`)
      continue
    }

    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: emp.nome,
        document: emp.cnpj,
        email: emp.email,
      })
      .select('id')
      .single()

    if (companyError) {
      if (companyError.code === '23505') {
        console.log(`⏭️  ${emp.nome}: empresa já existe (CNPJ duplicado), pulando`)
        skipped++
        continue
      }
      console.log(`⚠️  ${emp.nome}: erro ao criar company - ${companyError.message}`)
      continue
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: user!.id,
        full_name: emp.nome,
        name: emp.nome,
        company_id: company.id,
        role: 'transportadora',
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.log(`⚠️  ${emp.nome}: erro ao criar/atualizar profile - ${profileError.message}`)
      continue
    }

    const precoBase = 25 + i * 5
    const { error: routeError } = await admin.from('freight_routes').insert({
      carrier_id: user!.id,
      origin_zip: ORIGEM_CEP,
      dest_zip: DESTINO_CEP,
      price_per_kg: 1.1 + i * 0.05,
      min_price: precoBase,
      deadline_days: 4 + (i % 3),
      rate_card: {
        weight_0_30: precoBase,
        weight_31_50: precoBase + 20,
        weight_51_70: precoBase + 55,
        weight_71_100: precoBase + 85,
        above_101_per_kg: 1.1 + i * 0.05,
        dispatch_fee: 22.5,
        gris_percent: 0.5,
        insurance_percent: 0.3,
        toll_per_100kg: 2.5,
        icms_percent: 7,
      },
    })

    if (routeError) {
      console.log(`⚠️  ${emp.nome}: erro ao criar rota - ${routeError.message}`)
    } else {
      console.log(`✅ ${emp.nome} - rota ${ORIGEM_CEP} → ${DESTINO_CEP}`)
      created++
    }
  }

  console.log(`\n✅ Seed concluído! ${created} rotas criadas, ${skipped} puladas.`)
  console.log(`\n📋 Teste a cotação com:`)
  console.log(`   Origem: ${ORIGEM_CEP} (Guarulhos)`)
  console.log(`   Destino: ${DESTINO_CEP} (Recife)`)
  console.log(`   Peso: qualquer valor > 0`)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
