import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { PageBlock } from '@/app/actions/platform-actions'

export const dynamic = 'force-dynamic'

async function getCampaign(slug: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return data
}

function RenderBlock({ block }: { block: PageBlock }) {
  const c = block.content

  if (block.type === 'hero') {
    return (
      <div
        className="relative flex items-center justify-center text-center px-8 py-20"
        style={{
          backgroundColor: String(c.bg_color ?? '#1e293b'),
          minHeight: `${c.min_height ?? 400}px`,
          color: String(c.text_color ?? '#fff'),
        }}
      >
        {c.image_url && (
          <div className="absolute inset-0">
            <Image src={String(c.image_url)} alt="" fill className="object-cover opacity-40" unoptimized />
          </div>
        )}
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">{String(c.title ?? '')}</h1>
          {c.subtitle && (
            <p className="mt-4 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">{String(c.subtitle)}</p>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'text') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p
          className="leading-relaxed whitespace-pre-wrap"
          style={{
            textAlign: (c.align as 'left' | 'center' | 'right') ?? 'left',
            color: String(c.text_color ?? '#1e293b'),
            fontSize: `${c.font_size ?? 16}px`,
          }}
        >
          {String(c.content ?? '')}
        </p>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col items-center gap-3">
        {c.src ? (
          <div
            className={`relative w-full aspect-video ${c.rounded === 'true' ? 'rounded-xl overflow-hidden' : ''}`}
            style={{ width: `${c.width ?? 100}%` }}
          >
            <Image src={String(c.src)} alt={String(c.alt ?? '')} fill className="object-contain" unoptimized />
          </div>
        ) : null}
        {c.caption && <p className="text-sm text-slate-500 italic">{String(c.caption)}</p>}
      </div>
    )
  }

  if (block.type === 'cta') {
    return (
      <div
        className="px-6 py-16 text-center"
        style={{ backgroundColor: String(c.bg_color ?? '#f8fafc') }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3" style={{ color: String(c.text_color ?? '#1e293b') }}>
            {String(c.title ?? '')}
          </h2>
          {c.subtitle && (
            <p className="mb-6 text-lg opacity-70" style={{ color: String(c.text_color ?? '#1e293b') }}>
              {String(c.subtitle)}
            </p>
          )}
          <a
            href={String(c.button_url ?? '/')}
            className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: String(c.button_color ?? '#2BBCB3') }}
          >
            {String(c.button_label ?? 'Clique aqui')}
          </a>
        </div>
      </div>
    )
  }

  if (block.type === 'columns') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className="space-y-3">
              {c[`${side}_image`] && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden">
                  <Image src={String(c[`${side}_image`])} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800">{String(c[`${side}_title`] ?? '')}</h3>
              <p className="text-slate-600 leading-relaxed">{String(c[`${side}_text`] ?? '')}</p>
            </div>
          ))}
        </div>
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
      <div className="max-w-3xl mx-auto px-6 py-8">
        {embedUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="video" />
          </div>
        ) : null}
        {c.caption && (
          <p className="text-sm text-slate-500 text-center mt-3 italic">{String(c.caption)}</p>
        )}
      </div>
    )
  }

  if (block.type === 'divider') {
    return (
      <div style={{ paddingTop: `${c.margin ?? 32}px`, paddingBottom: `${c.margin ?? 32}px` }}>
        <hr className="max-w-3xl mx-auto" style={{ borderColor: String(c.color ?? '#e2e8f0') }} />
      </div>
    )
  }

  return null
}

export default async function CampaignPublicPage({ params }: { params: { slug: string } }) {
  const campaign = await getCampaign(params.slug)
  if (!campaign) notFound()

  const blocks: PageBlock[] = Array.isArray(campaign.page_content) ? campaign.page_content : []

  return (
    <main className="min-h-screen bg-white">
      {/* Blocks */}
      {blocks.length > 0 ? (
        <div>
          {blocks.map((block) => (
            <RenderBlock key={block.id} block={block} />
          ))}
        </div>
      ) : (
        /* Fallback: exibe imagem e info básica da campanha se não houver página montada */
        <div>
          {campaign.image_url && (
            <div className="relative w-full h-72 md:h-96" style={{ backgroundColor: campaign.bg_color ?? '#1e293b' }}>
              <Image src={campaign.image_url} alt={campaign.title} fill className="object-contain" unoptimized />
            </div>
          )}
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-4">{campaign.title}</h1>
            {campaign.description && (
              <p className="text-lg text-slate-600 mb-8">{campaign.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Footer minimal */}
      <div className="border-t border-slate-100 py-6 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-slate-700">
          ← Voltar para RotaClick
        </Link>
      </div>
    </main>
  )
}
