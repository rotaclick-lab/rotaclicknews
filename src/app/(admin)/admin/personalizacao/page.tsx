import { getPlatformSettings } from '@/app/actions/platform-actions'
import { Card, CardContent } from '@/components/ui/card'
import { PersonalizacaoForm } from './personalizacao-form'
import { Paintbrush } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPersonalizacaoPage() {
  const result = await getPlatformSettings()
  const settings = result.success ? result.data ?? {} : {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Personalização</h1>
        <p className="text-muted-foreground">
          Controle total sobre cores, textos, logo e aparência da plataforma
        </p>
      </div>

      {/* Preview da identidade atual */}
      <Card className="border-slate-200 overflow-hidden">
        <div
          className="h-16 flex items-center px-6 gap-3"
          style={{ backgroundColor: settings['brand_primary_color'] ?? '#2BBCB3' }}
        >
          {settings['brand_logo_url'] ? (
            <img src={settings['brand_logo_url']} alt="Logo" className="h-8 object-contain" />
          ) : (
            <span className="text-white font-bold text-xl">{settings['brand_name'] ?? 'RotaClick'}</span>
          )}
          <span className="text-white/80 text-sm">{settings['brand_tagline'] ?? ''}</span>
        </div>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paintbrush className="h-4 w-4" />
            Preview da identidade visual atual
          </div>
        </CardContent>
      </Card>

      <PersonalizacaoForm settings={settings} />
    </div>
  )
}
