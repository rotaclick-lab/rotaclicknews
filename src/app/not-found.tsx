import { BackButton } from './_components/back-button'

async function get404Settings() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_settings?key=in.(notfound_image_url,brand_primary_color,brand_logo_url,brand_name)&select=key,value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) throw new Error('fetch failed')
    const rows: { key: string; value: string }[] = await res.json()
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    return {
      imageUrl: map['notfound_image_url'] || '',
      primaryColor: map['brand_primary_color'] || '#2BBCB3',
      logoUrl: map['brand_logo_url'] || '',
      brandName: map['brand_name'] || 'RotaClick',
    }
  } catch {
    return { imageUrl: '', primaryColor: '#2BBCB3', logoUrl: '', brandName: 'RotaClick' }
  }
}

export default async function NotFound() {
  const { imageUrl, primaryColor, logoUrl, brandName } = await get404Settings()

  return (
    <>
      {/* Camada de fundo */}
      {imageUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -2,
        }} />
      )}
      {imageUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: -1,
        }} />
      )}

      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: imageUrl ? 'rgba(0,0,0,0.35)' : primaryColor,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        zIndex: 10,
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt={brandName} style={{ height: '44px', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
            {brandName}
          </span>
        )}
      </div>

      {/* Botão Voltar */}
      <div style={{
        position: 'fixed',
        bottom: '5rem',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        <BackButton
          color={imageUrl ? 'rgba(255,255,255,0.9)' : '#64748b'}
          borderColor={imageUrl ? 'rgba(255,255,255,0.5)' : '#e2e8f0'}
        />
      </div>
    </>
  )
}
