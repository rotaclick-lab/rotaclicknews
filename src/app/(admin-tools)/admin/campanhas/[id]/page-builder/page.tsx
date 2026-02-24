import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PageBuilderClient } from './page-builder-client'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
  return user
}

export default async function CampaignPageBuilderPage({ params }: { params: { id: string } }) {
  await requireAdmin()

  const admin = createAdminClient()
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!campaign) notFound()

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <PageBuilderClient campaign={campaign} />
    </div>
  )
}
