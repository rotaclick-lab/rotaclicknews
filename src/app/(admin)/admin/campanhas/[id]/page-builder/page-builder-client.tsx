'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateCampaign, type Campaign, type PageBlock } from '@/app/actions/platform-actions'
import {
  Save, Eye, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Type, ImageIcon, MousePointer, Columns, Minus, Video, Layout,
  ExternalLink, Loader2, GripVertical,
} from 'lucide-react'
import Link from 'next/link'

// ─── Block definitions ────────────────────────────────────────────────────────

const BLOCK_TYPES: Array<{
  type: PageBlock['type']
  label: string
  icon: React.ElementType
  description: string
  defaultContent: Record<string, string | number | boolean>
}> = [
  {
    type: 'hero',
    label: 'Hero / Banner',
    icon: Layout,
    description: 'Imagem grande com título e subtítulo',
    defaultContent: { title: 'Título principal', subtitle: 'Subtítulo da campanha', image_url: '', bg_color: '#1e293b', text_color: '#ffffff', min_height: '400' },
  },
  {
    type: 'text',
    label: 'Bloco de Texto',
    icon: Type,
    description: 'Parágrafo de texto rico',
    defaultContent: { content: 'Escreva seu texto aqui. Suporte a **negrito** e _itálico_.', align: 'left', text_color: '#1e293b', font_size: '16' },
  },
  {
    type: 'image',
    label: 'Imagem',
    icon: ImageIcon,
    description: 'Imagem com legenda opcional',
    defaultContent: { src: '', alt: '', caption: '', width: '100', rounded: 'true' },
  },
  {
    type: 'cta',
    label: 'Chamada para Ação',
    icon: MousePointer,
    description: 'Botão de destaque com texto',
    defaultContent: { title: 'Não perca essa oportunidade!', subtitle: '', button_label: 'Saiba mais', button_url: '/', button_color: '#2BBCB3', bg_color: '#f8fafc', text_color: '#1e293b' },
  },
  {
    type: 'columns',
    label: '2 Colunas',
    icon: Columns,
    description: 'Duas colunas lado a lado',
    defaultContent: { left_title: 'Coluna esquerda', left_text: 'Conteúdo da esquerda', right_title: 'Coluna direita', right_text: 'Conteúdo da direita', left_image: '', right_image: '' },
  },
  {
    type: 'video',
    label: 'Vídeo',
    icon: Video,
    description: 'Embed de vídeo do YouTube ou Vimeo',
    defaultContent: { url: '', caption: '' },
  },
  {
    type: 'divider',
    label: 'Divisor',
    icon: Minus,
    description: 'Linha separadora',
    defaultContent: { color: '#e2e8f0', margin: '32' },
  },
]

// ─── Block renderer (preview) ────────────────────────────────────────────────

function BlockPreview({ block }: { block: PageBlock }) {
  const c = block.content

  if (block.type === 'hero') {
    return (
      <div
        className="relative flex items-center justify-center text-center px-8 py-16 rounded-lg overflow-hidden"
        style={{ backgroundColor: String(c.bg_color ?? '#1e293b'), minHeight: `${c.min_height ?? 300}px`, color: String(c.text_color ?? '#fff') }}
      >
        {c.image_url && (
          <div className="absolute inset-0">
            <Image src={String(c.image_url)} alt="" fill className="object-cover opacity-40" unoptimized />
          </div>
        )}
        <div className="relative z-10">
          <h1 className="text-3xl font-black">{String(c.title ?? 'Título')}</h1>
          {c.subtitle && <p className="mt-3 text-lg opacity-90">{String(c.subtitle)}</p>}
        </div>
      </div>
    )
  }

  if (block.type === 'text') {
    return (
      <div className="py-4 px-2" style={{ textAlign: c.align as 'left' | 'center' | 'right' ?? 'left', color: String(c.text_color ?? '#1e293b'), fontSize: `${c.font_size ?? 16}px` }}>
        <p className="whitespace-pre-wrap leading-relaxed">{String(c.content ?? '')}</p>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div className={`flex flex-col items-center gap-2 py-4`}>
        {c.src ? (
          <div className={`relative w-[${c.width ?? 100}%] aspect-video ${c.rounded === 'true' ? 'rounded-xl overflow-hidden' : ''}`} style={{ width: `${c.width ?? 100}%` }}>
            <Image src={String(c.src)} alt={String(c.alt ?? '')} fill className="object-contain" unoptimized />
          </div>
        ) : (
          <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {c.caption && <p className="text-sm text-slate-500 italic">{String(c.caption)}</p>}
      </div>
    )
  }

  if (block.type === 'cta') {
    return (
      <div className="py-10 px-6 rounded-xl text-center" style={{ backgroundColor: String(c.bg_color ?? '#f8fafc') }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: String(c.text_color ?? '#1e293b') }}>{String(c.title ?? '')}</h2>
        {c.subtitle && <p className="mb-4 opacity-70" style={{ color: String(c.text_color ?? '#1e293b') }}>{String(c.subtitle)}</p>}
        <a
          href={String(c.button_url ?? '/')}
          className="inline-block px-6 py-3 rounded-lg font-semibold text-white"
          style={{ backgroundColor: String(c.button_color ?? '#2BBCB3') }}
        >
          {String(c.button_label ?? 'Clique aqui')}
        </a>
      </div>
    )
  }

  if (block.type === 'columns') {
    return (
      <div className="grid grid-cols-2 gap-6 py-4">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className="space-y-2">
            {c[`${side}_image`] && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <Image src={String(c[`${side}_image`])} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <h3 className="font-bold text-lg">{String(c[`${side}_title`] ?? '')}</h3>
            <p className="text-slate-600 text-sm">{String(c[`${side}_text`] ?? '')}</p>
          </div>
        ))}
      </div>
    )
  }

  if (block.type === 'video') {
    const url = String(c.url ?? '')
    const embedUrl = url.includes('youtube.com/watch?v=')
      ? url.replace('watch?v=', 'embed/')
      : url.includes('youtu.be/')
      ? url.replace('youtu.be/', 'www.youtube.com/embed/')
      : url

    return (
      <div className="py-4">
        {embedUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="video" />
          </div>
        ) : (
          <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
            <Video className="h-8 w-8" />
          </div>
        )}
        {c.caption && <p className="text-sm text-slate-500 text-center mt-2 italic">{String(c.caption)}</p>}
      </div>
    )
  }

  if (block.type === 'divider') {
    return (
      <div style={{ paddingTop: `${c.margin ?? 16}px`, paddingBottom: `${c.margin ?? 16}px` }}>
        <hr style={{ borderColor: String(c.color ?? '#e2e8f0') }} />
      </div>
    )
  }

  return null
}

// ─── Block editor (form fields) ──────────────────────────────────────────────

function BlockEditor({ block, onChange }: { block: PageBlock; onChange: (content: Record<string, string | number | boolean>) => void }) {
  const c = block.content
  const set = (key: string, val: string | number | boolean) => onChange({ ...c, [key]: val })

  const field = (key: string, label: string, type: 'text' | 'textarea' | 'color' | 'number' | 'url' = 'text') => (
    <div key={key}>
      <Label className="text-xs">{label}</Label>
      {type === 'textarea' ? (
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 min-h-[80px]"
          value={String(c[key] ?? '')}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : type === 'color' ? (
        <div className="flex gap-2 mt-1">
          <input type="color" value={String(c[key] ?? '#000000')} onChange={(e) => set(key, e.target.value)} className="h-9 w-10 rounded border cursor-pointer p-0.5" />
          <Input value={String(c[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
        </div>
      ) : (
        <Input
          type={type}
          value={String(c[key] ?? '')}
          onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="mt-1"
          placeholder={type === 'url' ? 'https://...' : ''}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-3 pt-2">
      {block.type === 'hero' && (<>
        {field('title', 'Título')}
        {field('subtitle', 'Subtítulo', 'textarea')}
        {field('image_url', 'URL da imagem de fundo', 'url')}
        {field('bg_color', 'Cor de fundo', 'color')}
        {field('text_color', 'Cor do texto', 'color')}
        {field('min_height', 'Altura mínima (px)', 'number')}
      </>)}

      {block.type === 'text' && (<>
        {field('content', 'Conteúdo', 'textarea')}
        <div>
          <Label className="text-xs">Alinhamento</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1" value={String(c.align ?? 'left')} onChange={(e) => set('align', e.target.value)}>
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </div>
        {field('text_color', 'Cor do texto', 'color')}
        {field('font_size', 'Tamanho da fonte (px)', 'number')}
      </>)}

      {block.type === 'image' && (<>
        {field('src', 'URL da imagem', 'url')}
        {field('alt', 'Texto alternativo')}
        {field('caption', 'Legenda')}
        {field('width', 'Largura (%)', 'number')}
        <div>
          <Label className="text-xs">Bordas arredondadas</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1" value={String(c.rounded)} onChange={(e) => set('rounded', e.target.value)}>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
      </>)}

      {block.type === 'cta' && (<>
        {field('title', 'Título')}
        {field('subtitle', 'Subtítulo', 'textarea')}
        {field('button_label', 'Texto do botão')}
        {field('button_url', 'URL do botão', 'url')}
        {field('button_color', 'Cor do botão', 'color')}
        {field('bg_color', 'Cor de fundo', 'color')}
        {field('text_color', 'Cor do texto', 'color')}
      </>)}

      {block.type === 'columns' && (<>
        {field('left_title', 'Título esquerda')}
        {field('left_text', 'Texto esquerda', 'textarea')}
        {field('left_image', 'Imagem esquerda (URL)', 'url')}
        {field('right_title', 'Título direita')}
        {field('right_text', 'Texto direita', 'textarea')}
        {field('right_image', 'Imagem direita (URL)', 'url')}
      </>)}

      {block.type === 'video' && (<>
        {field('url', 'URL do YouTube / Vimeo', 'url')}
        {field('caption', 'Legenda')}
      </>)}

      {block.type === 'divider' && (<>
        {field('color', 'Cor da linha', 'color')}
        {field('margin', 'Espaçamento vertical (px)', 'number')}
      </>)}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PageBuilderClient({ campaign }: { campaign: Campaign }) {
  const [blocks, setBlocks] = useState<PageBlock[]>(campaign.page_content ?? [])
  const [slug, setSlug] = useState(campaign.slug ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null

  const addBlock = useCallback((type: PageBlock['type']) => {
    const def = BLOCK_TYPES.find((t) => t.type === type)!
    const newBlock: PageBlock = {
      id: `block-${Date.now()}`,
      type,
      content: { ...def.defaultContent },
    }
    setBlocks((prev) => [...prev, newBlock])
    setSelectedId(newBlock.id)
    setShowAddPanel(false)
  }, [])

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setSelectedId(null)
  }, [])

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0) return prev
      const newIdx = dir === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }, [])

  const updateBlockContent = useCallback((id: string, content: Record<string, string | number | boolean>) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, content } : b))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await updateCampaign(campaign.id, {
      slug: slug.trim() || undefined,
      page_content: blocks,
    })
    setSaving(false)
    if (res.success) {
      toast.success('Página salva com sucesso!')
    } else {
      toast.error(res.error ?? 'Erro ao salvar')
    }
  }

  const publicUrl = slug ? `/campanhas/${slug}` : null

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link href="/admin/campanhas">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{campaign.title}</p>
          <p className="text-xs text-muted-foreground">Editor de página da campanha</p>
        </div>

        {/* Slug */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">/campanhas/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
            placeholder="meu-slug"
            className="text-sm border-none outline-none bg-transparent w-28"
          />
        </div>

        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          </a>
        )}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel: add blocks */}
        <div className="w-56 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocos</p>
          </div>
          <div className="p-2 space-y-1">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-shrink-0">
                  <bt.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 leading-tight">{bt.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight truncate">{bt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: canvas preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm min-h-[600px] overflow-hidden">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center gap-4 text-muted-foreground">
                <Plus className="h-10 w-10 opacity-30" />
                <p className="text-sm">Adicione blocos no painel esquerdo para construir sua página</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {blocks.map((block, idx) => {
                  const isSelected = block.id === selectedId
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedId(block.id)}
                      className={`relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-brand-400 ring-inset' : 'hover:ring-1 hover:ring-slate-300 hover:ring-inset'}`}
                    >
                      {/* Block toolbar */}
                      <div className={`absolute top-2 right-2 z-10 flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                          disabled={idx === 0}
                          className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                          disabled={idx === blocks.length - 1}
                          className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
                          className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Type label */}
                      <div className={`absolute top-2 left-2 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          {BLOCK_TYPES.find((t) => t.type === block.type)?.label}
                        </span>
                      </div>

                      <div className="p-6">
                        <BlockPreview block={block} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: block editor */}
        <div className="w-72 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          {selectedBlock ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const def = BLOCK_TYPES.find((t) => t.type === selectedBlock.type)
                  if (!def) return null
                  return (
                    <>
                      <div className="p-1.5 rounded-md bg-brand-50 text-brand-600"><def.icon className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-semibold">{def.label}</p>
                        <p className="text-xs text-muted-foreground">{def.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <hr className="border-slate-100" />
              <BlockEditor
                block={selectedBlock}
                onChange={(content) => updateBlockContent(selectedBlock.id, content)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground p-6 text-center">
              <Layout className="h-8 w-8 opacity-30" />
              <p className="text-sm">Clique em um bloco no canvas para editar suas propriedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
