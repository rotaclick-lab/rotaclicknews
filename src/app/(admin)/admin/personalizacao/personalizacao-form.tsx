'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePlatformSettingsBatch } from '@/app/actions/platform-actions'
import { Palette, Type, Globe, Settings2, Save } from 'lucide-react'

interface Props {
  settings: Record<string, string>
}

export function PersonalizacaoForm({ settings }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(settings)

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (keys: string[]) => {
    setLoading(true)
    const batch: Record<string, string> = {}
    for (const k of keys) batch[k] = values[k] ?? ''
    const res = await updatePlatformSettingsBatch(batch)
    setLoading(false)
    if (res.success) {
      toast.success('Configurações salvas com sucesso!')
      router.refresh()
    } else {
      toast.error(res.error ?? 'Erro ao salvar')
    }
  }

  const Field = ({
    label,
    settingKey,
    type = 'text',
    placeholder,
    hint,
  }: {
    label: string
    settingKey: string
    type?: string
    placeholder?: string
    hint?: string
  }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {type === 'color' ? (
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={values[settingKey] ?? '#000000'}
            onChange={(e) => set(settingKey, e.target.value)}
            className="h-9 w-12 rounded border border-input cursor-pointer"
          />
          <Input
            value={values[settingKey] ?? ''}
            onChange={(e) => set(settingKey, e.target.value)}
            placeholder={placeholder ?? '#000000'}
            className="flex-1 font-mono"
          />
        </div>
      ) : type === 'textarea' ? (
        <textarea
          value={values[settingKey] ?? ''}
          onChange={(e) => set(settingKey, e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
        />
      ) : (
        <Input
          type={type}
          value={values[settingKey] ?? ''}
          onChange={(e) => set(settingKey, e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Identidade Visual */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-600" />
            Identidade Visual
          </CardTitle>
          <CardDescription>Cores, logo e nome da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome da plataforma" settingKey="brand_name" placeholder="RotaClick" />
            <Field label="Slogan" settingKey="brand_tagline" placeholder="Conectando cargas e transportadoras" />
            <Field label="Cor primária" settingKey="brand_primary_color" type="color" placeholder="#2BBCB3" hint="Cor principal dos botões e destaques" />
            <Field label="Cor secundária" settingKey="brand_secondary_color" type="color" placeholder="#F5921B" hint="Cor de acentuação e CTAs secundários" />
            <Field label="URL do Logo" settingKey="brand_logo_url" placeholder="https://..." hint="Link direto para a imagem do logo (PNG/SVG)" />
            <Field label="URL do Favicon" settingKey="brand_favicon_url" placeholder="https://..." hint="Ícone exibido na aba do navegador" />
          </div>

          {/* Preview ao vivo */}
          <div className="rounded-xl overflow-hidden border border-slate-200 mt-2">
            <div
              className="h-14 flex items-center px-5 gap-3"
              style={{ backgroundColor: values['brand_primary_color'] ?? '#2BBCB3' }}
            >
              {values['brand_logo_url'] ? (
                <img src={values['brand_logo_url']} alt="Logo" className="h-8 object-contain" />
              ) : (
                <span className="text-white font-bold text-lg">{values['brand_name'] ?? 'RotaClick'}</span>
              )}
              <span className="text-white/80 text-sm">{values['brand_tagline'] ?? ''}</span>
            </div>
            <div className="p-3 bg-white flex gap-2">
              <button
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: values['brand_primary_color'] ?? '#2BBCB3' }}
              >
                Botão primário
              </button>
              <button
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: values['brand_secondary_color'] ?? '#F5921B' }}
              >
                Botão secundário
              </button>
            </div>
          </div>

          <Button
            onClick={() => handleSave(['brand_name', 'brand_tagline', 'brand_primary_color', 'brand_secondary_color', 'brand_logo_url', 'brand_favicon_url'])}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar identidade visual'}
          </Button>
        </CardContent>
      </Card>

      {/* Textos da Home */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-purple-600" />
            Textos da Home Pública
          </CardTitle>
          <CardDescription>Título, subtítulo e CTA exibidos na página principal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Título do Hero" settingKey="home_hero_title" placeholder="Cotação de frete rápida e transparente" />
            <Field label="Subtítulo do Hero" settingKey="home_hero_subtitle" placeholder="Compare transportadoras e feche negócio em minutos" type="textarea" />
            <Field label="Label do botão CTA" settingKey="home_hero_cta_label" placeholder="Cotar agora" />
          </div>
          <Button
            onClick={() => handleSave(['home_hero_title', 'home_hero_subtitle', 'home_hero_cta_label'])}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar textos da home'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações gerais */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-orange-600" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>Comissão, contato, limites e rodapé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Comissão da plataforma (%)" settingKey="platform_fee_percent" type="number" placeholder="10" hint="Percentual cobrado sobre cada frete pago" />
            <Field label="Tamanho máximo de upload (MB)" settingKey="max_file_size_mb" type="number" placeholder="5" />
            <Field label="Email de contato" settingKey="contact_email" type="email" placeholder="contato@rotaclick.com.br" />
            <Field label="Telefone de contato" settingKey="contact_phone" placeholder="(11) 99999-9999" />
            <Field label="Texto do rodapé" settingKey="footer_text" placeholder="© 2025 RotaClick..." type="textarea" />
          </div>
          <Button
            onClick={() => handleSave(['platform_fee_percent', 'max_file_size_mb', 'contact_email', 'contact_phone', 'footer_text'])}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar configurações gerais'}
          </Button>
        </CardContent>
      </Card>

      {/* Modo manutenção */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Globe className="h-5 w-5" />
            Modo Manutenção
          </CardTitle>
          <CardDescription className="text-amber-700">
            Quando ativado, exibe uma mensagem de manutenção para todos os usuários não-admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-amber-800">Status atual:</Label>
            <button
              type="button"
              onClick={() => set('maintenance_mode', values['maintenance_mode'] === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                values['maintenance_mode'] === 'true' ? 'bg-red-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  values['maintenance_mode'] === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${values['maintenance_mode'] === 'true' ? 'text-red-700' : 'text-slate-600'}`}>
              {values['maintenance_mode'] === 'true' ? 'ATIVADO' : 'Desativado'}
            </span>
          </div>
          <Field
            label="Mensagem de manutenção"
            settingKey="maintenance_message"
            placeholder="Estamos em manutenção. Voltamos em breve!"
            type="textarea"
          />
          <Button
            onClick={() => handleSave(['maintenance_mode', 'maintenance_message'])}
            disabled={loading}
            variant={values['maintenance_mode'] === 'true' ? 'destructive' : 'default'}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar modo manutenção'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
