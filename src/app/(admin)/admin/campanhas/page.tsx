import { listCampaigns } from '@/app/actions/platform-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CampanhasList } from './campanhas-list'

export const dynamic = 'force-dynamic'

export default async function AdminCampanhasPage() {
  const result = await listCampaigns()
  const campaigns = result.success ? result.data ?? [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campanhas & Destaques</h1>
        <p className="text-muted-foreground">
          Gerencie banners, transportadoras em destaque e promoções exibidas na home pública
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Campanhas ativas</CardTitle>
          <CardDescription>{campaigns.length} campanha(s) cadastrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <CampanhasList campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  )
}
