import { createAdminClient } from '@/lib/supabase/admin'
import { FreightTableAnalyzer } from './freight-table-analyzer'

export const dynamic = 'force-dynamic'

async function getCarriers() {
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, company_id')
    .eq('role', 'transportadora')
  const companyIds = [...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean))]
  if (!companyIds.length) return []
  const { data: companies } = await admin
    .from('companies')
    .select('id, nome_fantasia, razao_social, name')
    .in('id', companyIds)
    .order('nome_fantasia')
  return (companies ?? []).map((c) => {
    const profile = (profiles ?? []).find((p) => p.company_id === c.id)
    return {
      id: c.id,
      name: c.nome_fantasia || c.razao_social || c.name || c.id,
      user_id: profile?.id ?? null,
    }
  })
}

export default async function AnalisarTabelaPage() {
  const carriers = await getCarriers()
  return <FreightTableAnalyzer carriers={carriers} />
}
