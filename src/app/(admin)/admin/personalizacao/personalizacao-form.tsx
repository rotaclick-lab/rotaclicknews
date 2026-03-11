'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePlatformSettingsBatch } from '@/app/actions/platform-actions'
import { Palette, Type, Globe, Settings2, Save, ImageIcon, Upload, Trash2, Loader2, Truck } from 'lucide-react'

interface Props {
  settings: Record<string, string>
}

export function PersonalizacaoForm({ settings }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImg404, setUploadingImg404] = useState(false)
  const fileInputRef404 = useRef<HTMLInputElement>(null)
  const [uploadingImgCarrier, setUploadingImgCarrier] = useState(false)
  const fileInputRefCarrier = useRef<HTMLInputElement>(null)

  const handleMaintenanceImageUpload = async (file: File) => {
    setUploadingImg(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/maintenance-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao fazer upload')
      } else {
        set('maintenance_image_url', json.url)
        toast.success('Imagem enviada com sucesso!')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão ao fazer upload')
    } finally {
      setUploadingImg(false)
    }
  }

  const handleNotFoundImageUpload = async (file: File) => {
    setUploadingImg404(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/notfound-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao fazer upload')
      } else {
        set('notfound_image_url', json.url)
        toast.success('Imagem enviada com sucesso!')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão ao fazer upload')
    } finally {
      setUploadingImg404(false)
    }
  }

  const handleCarrierPlaceholderUpload = async (file: File) => {
    setUploadingImgCarrier(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/carrier-placeholder-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao fazer upload')
      } else {
        set('carrier_placeholder_image_url', json.url)
        toast.success('Imagem enviada com sucesso!')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão ao fazer upload')
    } finally {
      setUploadingImgCarrier(false)
    }
  }

  const handleCarrierPlaceholderRemove = async () => {
    setUploadingImgCarrier(true)
    try {
      const res = await fetch('/api/admin/carrier-placeholder-image', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao remover imagem')
      } else {
        set('carrier_placeholder_image_url', '')
        toast.success('Imagem removida')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setUploadingImgCarrier(false)
    }
  }

  const handleNotFoundImageRemove = async () => {
    setUploadingImg404(true)
    try {
      const res = await fetch('/api/admin/notfound-image', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao remover imagem')
      } else {
        set('notfound_image_url', '')
        toast.success('Imagem removida')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setUploadingImg404(false)
    }
  }

  const handleMaintenanceImageRemove = async () => {
    setUploadingImg(true)
    try {
      const res = await fetch('/api/admin/maintenance-image', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao remover imagem')
      } else {
        set('maintenance_image_url', '')
        toast.success('Imagem removida')
        router.refresh()
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setUploadingImg(false)
    }
  }

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
            Quando ativado, exibe a página de manutenção para todos os usuários não-admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle on/off */}
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

          {/* Campos de personalização */}
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-amber-200">
            <Field
              label="Título da página"
              settingKey="maintenance_title"
              placeholder="Sistema em Manutenção"
              hint="Título exibido em destaque na página"
            />
            <Field
              label="Mensagem"
              settingKey="maintenance_message"
              placeholder="Estamos realizando melhorias. Voltamos em breve!"
              type="textarea"
              hint="Mensagem explicativa exibida abaixo do título"
            />
            {/* Upload de imagem de manutenção */}
            <div className="space-y-2">
              <Label>Imagem de fundo</Label>
              <p className="text-xs text-muted-foreground">Será exibida como fundo da página de manutenção. JPG, PNG, WebP ou SVG — máx. 10MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleMaintenanceImageUpload(file)
                  e.target.value = ''
                }}
              />
              {values['maintenance_image_url'] ? (
                <div className="relative rounded-xl overflow-hidden border border-amber-200 bg-white">
                  <img
                    src={values['maintenance_image_url']}
                    alt="Fundo manutenção"
                    className="w-full max-h-28 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Trocar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleMaintenanceImageRemove}
                      disabled={uploadingImg}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImg}
                  className="w-full border-2 border-dashed border-amber-300 rounded-xl p-8 text-center hover:border-amber-500 hover:bg-amber-50/50 transition-colors disabled:opacity-50"
                >
                  {uploadingImg ? (
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-amber-500" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                  )}
                  <p className="text-sm font-medium text-amber-700">
                    {uploadingImg ? 'Enviando...' : 'Clique para fazer upload'}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">JPG, PNG, WebP, SVG — máx. 10MB</p>
                </button>
              )}
            </div>
          </div>

          {/* Preview da página de manutenção */}
          {(values['maintenance_title'] || values['maintenance_message'] || values['maintenance_image_url']) && (
            <div className="rounded-xl overflow-hidden border border-amber-200 mt-2">
              <div className="text-xs text-amber-700 bg-amber-100 px-3 py-1.5 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Preview da página de manutenção
              </div>
              <div className="bg-white p-4 text-center space-y-3">
                {values['maintenance_image_url'] ? (
                  <img
                    src={values['maintenance_image_url']}
                    alt="preview"
                    className="mx-auto max-h-32 object-contain rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="text-3xl">🔧</div>
                )}
                <p className="font-bold text-slate-800 text-sm">
                  {values['maintenance_title'] || 'Sistema em Manutenção'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {values['maintenance_message'] || 'Estamos realizando melhorias. Voltamos em breve!'}
                </p>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full w-1/3 rounded-full"
                    style={{ backgroundColor: values['brand_primary_color'] ?? '#2BBCB3' }}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => handleSave(['maintenance_mode', 'maintenance_title', 'maintenance_message', 'maintenance_image_url'])}
            disabled={loading}
            variant={values['maintenance_mode'] === 'true' ? 'destructive' : 'default'}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar modo manutenção'}
          </Button>
        </CardContent>
      </Card>
      {/* Imagem placeholder transportadora */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Truck className="h-5 w-5 text-brand-500" />
            Imagem Placeholder de Transportadora
          </CardTitle>
          <CardDescription>
            Exibida no card de oferta quando a transportadora não tiver logo cadastrado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou SVG — máx. 10MB. Recomendado: ícone ou ilustração de caminhão/transportadora.</p>
          <input
            ref={fileInputRefCarrier}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleCarrierPlaceholderUpload(file)
              e.target.value = ''
            }}
          />
          {values['carrier_placeholder_image_url'] ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white">
              <img
                src={values['carrier_placeholder_image_url']}
                alt="Placeholder transportadora"
                className="w-full max-h-28 object-contain p-4"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRefCarrier.current?.click()}
                  disabled={uploadingImgCarrier}
                >
                  <Upload className="h-4 w-4 mr-1" /> Trocar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleCarrierPlaceholderRemove}
                  disabled={uploadingImgCarrier}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                </Button>
              </div>
              {uploadingImgCarrier && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRefCarrier.current?.click()}
              disabled={uploadingImgCarrier}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-colors disabled:opacity-50"
            >
              {uploadingImgCarrier ? (
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-brand-400" />
              ) : (
                <Truck className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              )}
              <p className="text-sm font-medium text-slate-600">
                {uploadingImgCarrier ? 'Enviando...' : 'Clique para fazer upload'}
              </p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, SVG — máx. 10MB</p>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Página 404 */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <ImageIcon className="h-5 w-5" />
            Página de Erro 404
          </CardTitle>
          <CardDescription>
            Personaliza a página exibida quando um usuário acessa uma rota inexistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Título da página"
              settingKey="notfound_title"
              placeholder="Página não encontrada"
              hint="Título exibido em destaque na página 404"
            />
            <Field
              label="Mensagem"
              settingKey="notfound_message"
              placeholder="A página que você procura não existe ou foi movida."
              type="textarea"
              hint="Mensagem explicativa exibida abaixo do título"
            />
            {/* Upload de imagem 404 */}
            <div className="space-y-2">
              <Label>Imagem de fundo</Label>
              <p className="text-xs text-muted-foreground">Será exibida como fundo da página 404. JPG, PNG, WebP ou SVG — máx. 10MB.</p>
              <input
                ref={fileInputRef404}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleNotFoundImageUpload(file)
                  e.target.value = ''
                }}
              />
              {values['notfound_image_url'] ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={values['notfound_image_url']}
                    alt="Fundo 404"
                    className="w-full max-h-28 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef404.current?.click()}
                      disabled={uploadingImg404}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Trocar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleNotFoundImageRemove}
                      disabled={uploadingImg404}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                  {uploadingImg404 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef404.current?.click()}
                  disabled={uploadingImg404}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-500 hover:bg-slate-50/50 transition-colors disabled:opacity-50"
                >
                  {uploadingImg404 ? (
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-slate-400" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  )}
                  <p className="text-sm font-medium text-slate-600">
                    {uploadingImg404 ? 'Enviando...' : 'Clique para fazer upload'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, SVG — máx. 10MB</p>
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {(values['notfound_title'] || values['notfound_message'] || values['notfound_image_url']) && (
            <div className="rounded-xl overflow-hidden border border-slate-200 mt-2">
              <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Preview da página 404
              </div>
              <div className="bg-white p-4 text-center space-y-3">
                {values['notfound_image_url'] ? (
                  <img
                    src={values['notfound_image_url']}
                    alt="preview 404"
                    className="mx-auto max-h-32 object-contain rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="text-3xl">🗺️</div>
                )}
                <div className="text-4xl font-black" style={{ color: `${values['brand_primary_color'] ?? '#2BBCB3'}40` }}>404</div>
                <p className="font-bold text-slate-800 text-sm">
                  {values['notfound_title'] || 'Página não encontrada'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {values['notfound_message'] || 'A página que você procura não existe ou foi movida.'}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => handleSave(['notfound_title', 'notfound_message', 'notfound_image_url'])}
            disabled={loading}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar página 404'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
