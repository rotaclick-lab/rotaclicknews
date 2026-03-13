import { createAdminClient } from '@/lib/supabase/admin'
import { FreightTableAnalyzer } from './freight-table-analyzer'

export const dynamic = 'force-dynamic'

async function getCarriers() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('companies')
    .select('id, name, user_id')
    .eq('approval_status', 'approved')
    .order('name')
  return data ?? []
}

export default async function AnalisarTabelaPage() {
  const carriers = await getCarriers()
  return <FreightTableAnalyzer carriers={carriers} />
}
