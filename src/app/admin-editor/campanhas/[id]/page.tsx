import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageBuilderClient } from './page-builder-client'

export const dynamic = 'force-dynamic'

export default async function CampaignEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log('[Editor] acessando id:', id)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[Editor] user:', user?.id ?? 'null', '| authError:', authError?.message ?? 'none')
  if (!user) { console.log('[Editor] sem user → redirect /login'); redirect('/login') }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  console.log('[Editor] profile.role:', profile?.role ?? 'null', '| profileError:', profileError?.message ?? 'none')

  if (profile?.role !== 'admin') { console.log('[Editor] role mismatch → redirect /admin'); redirect('/admin') }

  const admin = createAdminClient()
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()
  console.log('[Editor] campaign:', campaign?.id ?? 'null', '| campaignError:', campaignError?.message ?? 'none')

  if (!campaign) { console.log('[Editor] campanha nao encontrada → redirect /admin/campanhas'); redirect('/admin/campanhas') }

  return <PageBuilderClient campaign={campaign} />
}
