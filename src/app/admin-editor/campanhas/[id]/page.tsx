import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageBuilderClient } from './page-builder-client'

export const dynamic = 'force-dynamic'

export default async function CampaignEditorPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin')

  const admin = createAdminClient()
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!campaign) redirect('/admin/campanhas')

  return <PageBuilderClient campaign={campaign} />
}
