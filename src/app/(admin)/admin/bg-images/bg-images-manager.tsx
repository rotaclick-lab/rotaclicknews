'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Upload, Trash2, Loader2, Monitor, Tablet, Smartphone, ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Device = 'desktop' | 'tablet' | 'mobile'
type BgImage = { name: string; url: string; path: string }
type Grouped = Record<Device, BgImage[]>

const DEVICE_CONFIG: { key: Device; label: string; icon: React.ElementType; hint: string; ratio: string }[] = [
  {
    key: 'desktop',
    label: 'Desktop',
    icon: Monitor,
    hint: 'Landscape — recomendado 1920×1080px ou maior',
    ratio: 'aspect-video',
  },
  {
    key: 'tablet',
    label: 'Tablet',
    icon: Tablet,
    hint: 'Portrait ou landscape — recomendado 1024×768px',
    ratio: 'aspect-[4/3]',
  },
  {
    key: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    hint: 'Portrait — recomendado 768×1024px',
    ratio: 'aspect-[9/16]',
  },
]

export function BgImagesManager() {
  const [images, setImages] = useState<Grouped>({ desktop: [], tablet: [], mobile: [] })
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [uploading, setUploading] = useState<Device | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const inputRefs = useRef<Record<Device, HTMLInputElement | null>>({ desktop: null, tablet: null, mobile: null })

  const fetchImages = useCallback(async () => {
    setLoadingFetch(true)
    try {
      const res = await fetch('/api/admin/bg-images')
      const json = await res.json()
      if (json.success) setImages(json.data)
      else toast.error(json.error ?? 'Erro ao carregar imagens')
    } catch {
      toast.error('Erro de rede')
    } finally {
      setLoadingFetch(false)
    }
  }, [])

  useEffect(() => { void fetchImages() }, [fetchImages])

  const handleUpload = async (device: Device, file: File) => {
    setUploading(device)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('device', device)
    try {
      const res = await fetch('/api/admin/bg-images', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro no upload')
      } else {
        toast.success('Imagem enviada!')
        await fetchImages()
      }
    } catch {
      toast.error('Erro ao enviar')
    } finally {
      setUploading(null)
    }
  }

  const handleDelete = async (path: string) => {
    if (!confirm('Remover esta imagem?')) return
    setDeleting(path)
    try {
      const res = await fetch('/api/admin/bg-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Erro ao remover')
      } else {
        toast.success('Imagem removida')
        await fetchImages()
      }
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Imagens de Fundo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload das imagens usadas como fundo na home. Uma imagem aleatória é escolhida a cada visita, por dispositivo.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchImages} disabled={loadingFetch}>
          {loadingFetch ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Atualizar</span>
        </Button>
      </div>

      {/* Sections por device */}
      {DEVICE_CONFIG.map(({ key, label, icon: Icon, hint, ratio }) => {
        const list = images[key] ?? []
        const isUploading = uploading === key
        const total = list.length

        return (
          <section key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <Icon className="h-4 w-4 text-slate-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {total} {total === 1 ? 'imagem' : 'imagens'}
                </span>
                <Button
                  size="sm"
                  onClick={() => inputRefs.current[key]?.click()}
                  disabled={isUploading}
                  className="bg-slate-900 hover:bg-slate-700 text-white"
                >
                  {isUploading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                  {isUploading ? 'Enviando...' : 'Adicionar imagem'}
                </Button>
                <input
                  ref={(el) => { inputRefs.current[key] = el }}
                  type="file"
                  accept="image/webp,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleUpload(key, f)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>

            {/* Grid de imagens */}
            <div className="p-6">
              {loadingFetch && total === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : total === 0 ? (
                <button
                  type="button"
                  onClick={() => inputRefs.current[key]?.click()}
                  disabled={isUploading}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Clique para adicionar a primeira imagem de {label.toLowerCase()}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {list.map((img) => (
                    <div key={img.path} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`relative w-full ${ratio}`}>
                        <Image
                          src={img.url}
                          alt={img.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      {/* Overlay com ações */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => void handleDelete(img.path)}
                          disabled={deleting === img.path}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-colors disabled:opacity-50"
                          title="Remover imagem"
                        >
                          {deleting === img.path
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Nome do arquivo */}
                      <div className="px-2 py-1.5 bg-white border-t border-slate-100">
                        <p className="text-[10px] text-slate-500 truncate">{img.name}</p>
                      </div>
                    </div>
                  ))}

                  {/* Botão add inline */}
                  <button
                    type="button"
                    onClick={() => inputRefs.current[key]?.click()}
                    disabled={isUploading}
                    className={`rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors ${ratio} w-full`}
                  >
                    {isUploading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <Upload className="h-5 w-5" />}
                    <span className="text-xs">Adicionar</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )
      })}

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Como funciona</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700 text-xs">
          <li>A home escolhe automaticamente uma imagem aleatória ao carregar, por tipo de dispositivo</li>
          <li>Se não houver imagem de tablet, usa a de desktop</li>
          <li>Se não houver nenhuma imagem, usa o fundo padrão</li>
          <li>Formatos aceitos: WebP, JPG, PNG — máximo 20MB por imagem</li>
        </ul>
      </div>
    </div>
  )
}
