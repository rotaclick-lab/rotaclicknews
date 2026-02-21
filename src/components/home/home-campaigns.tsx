import { listActiveCampaigns } from '@/app/actions/platform-actions'
import Link from 'next/link'

export async function HomeCampaigns() {
  const result = await listActiveCampaigns()
  const campaigns = result.success ? (result.data ?? []) : []

  if (campaigns.length === 0) return null

  const banners = campaigns.filter((c) => c.type === 'banner')
  const featured = campaigns.filter((c) => c.type === 'featured_carrier')
  const promos = campaigns.filter((c) => c.type === 'promo')

  return (
    <div className="w-full space-y-3">
      {/* Banners */}
      {banners.map((c) => (
        <div
          key={c.id}
          className="w-full rounded-xl overflow-hidden shadow-sm"
          style={{ backgroundColor: c.bg_color ?? '#2BBCB3' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              {c.image_url && (
                <img src={c.image_url} alt={c.title} className="h-12 w-12 object-contain rounded-lg" />
              )}
              <div>
                <p className="font-bold text-base" style={{ color: c.text_color ?? '#fff' }}>
                  {c.title}
                </p>
                {c.description && (
                  <p className="text-sm opacity-90" style={{ color: c.text_color ?? '#fff' }}>
                    {c.description}
                  </p>
                )}
              </div>
            </div>
            {c.link_url && (
              <Link
                href={c.link_url}
                className="shrink-0 px-5 py-2 rounded-lg text-sm font-bold bg-white/20 hover:bg-white/30 transition-colors"
                style={{ color: c.text_color ?? '#fff' }}
              >
                {c.link_label ?? 'Saiba mais'}
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* Transportadoras em destaque */}
      {featured.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Transportadoras em destaque
          </p>
          <div className="flex flex-wrap gap-3">
            {featured.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm"
                style={{ backgroundColor: c.bg_color ?? '#f8fafc', borderColor: '#e2e8f0' }}
              >
                {c.image_url && (
                  <img src={c.image_url} alt={c.title} className="h-8 w-8 object-contain rounded" />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: c.text_color ?? '#1e293b' }}>
                    {c.title}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  )}
                </div>
                {c.link_url && (
                  <Link
                    href={c.link_url}
                    className="text-xs text-indigo-600 hover:underline ml-2"
                  >
                    {c.link_label ?? 'Ver'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promos */}
      {promos.map((c) => (
        <div
          key={c.id}
          className="w-full rounded-xl border-2 border-dashed px-5 py-3 flex items-center justify-between gap-4"
          style={{ borderColor: c.bg_color ?? '#2BBCB3', backgroundColor: `${c.bg_color ?? '#2BBCB3'}15` }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: c.bg_color ?? '#2BBCB3' }}>
              🎉 {c.title}
            </p>
            {c.description && (
              <p className="text-xs text-muted-foreground">{c.description}</p>
            )}
          </div>
          {c.link_url && (
            <Link
              href={c.link_url}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: c.bg_color ?? '#2BBCB3' }}
            >
              {c.link_label ?? 'Ver promoção'}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
