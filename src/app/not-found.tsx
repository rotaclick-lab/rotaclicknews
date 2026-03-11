async function get404Settings(): Promise<{
  title: string
  message: string
  imageUrl: string
  primaryColor: string
  logoUrl: string
  brandName: string
}> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_settings?key=in.(notfound_title,notfound_message,notfound_image_url,brand_primary_color,brand_logo_url,brand_name)&select=key,value`,
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
      title: map['notfound_title'] || 'Página não encontrada',
      message: map['notfound_message'] || 'A página que você procura não existe ou foi movida.',
      imageUrl: map['notfound_image_url'] || '',
      primaryColor: map['brand_primary_color'] || '#2BBCB3',
      logoUrl: map['brand_logo_url'] || '',
      brandName: map['brand_name'] || 'RotaClick',
    }
  } catch {
    return {
      title: 'Página não encontrada',
      message: 'A página que você procura não existe ou foi movida.',
      imageUrl: '',
      primaryColor: '#2BBCB3',
      logoUrl: '',
      brandName: 'RotaClick',
    }
  }
}

export default async function NotFound() {
  const { title, message, imageUrl, primaryColor, logoUrl, brandName } =
    await get404Settings()

  const year = new Date().getFullYear()

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 — {brandName}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #fef3c7 100%);
          }
          ${imageUrl ? `
          .bg-layer {
            position: fixed;
            inset: 0;
            background-image: url('${imageUrl}');
            background-size: 100% 100%;
            background-position: center center;
            background-repeat: no-repeat;
            z-index: 0;
          }
          .bg-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1;
          }
          header, main, footer { position: relative; z-index: 2; }
          ` : ''}
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-12px); }
          }
          @keyframes pulse-ring {
            0%   { transform: scale(0.95); opacity: 1; }
            70%  { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(0.95); opacity: 0; }
          }
          .icon-float { animation: float 3s ease-in-out infinite; }
          .icon-ring {
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 3px solid ${primaryColor};
            animation: pulse-ring 2s ease-out infinite;
          }
          .btn-home {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: ${primaryColor};
            color: #fff;
            font-weight: 700;
            font-size: 0.9375rem;
            padding: 0.75rem 1.75rem;
            border-radius: 9999px;
            text-decoration: none;
            transition: opacity 0.15s;
          }
          .btn-home:hover { opacity: 0.85; }
          .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: transparent;
            color: ${imageUrl ? 'rgba(255,255,255,0.75)' : '#64748b'};
            font-weight: 600;
            font-size: 0.9375rem;
            padding: 0.75rem 1.75rem;
            border-radius: 9999px;
            text-decoration: none;
            border: 2px solid ${imageUrl ? 'rgba(255,255,255,0.3)' : '#e2e8f0'};
            transition: opacity 0.15s;
          }
          .btn-back:hover { opacity: 0.75; }
        `}</style>
      </head>
      <body>
        {imageUrl && <div className="bg-layer" />}
        {imageUrl && <div className="bg-overlay" />}

        <header style={{
          backgroundColor: imageUrl ? 'rgba(0,0,0,0.35)' : primaryColor,
          backdropFilter: imageUrl ? 'blur(8px)' : undefined,
          borderBottom: imageUrl ? '1px solid rgba(255,255,255,0.15)' : undefined,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} style={{ height: '44px', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              {brandName}
            </span>
          )}
        </header>

        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 1rem 4rem',
        }}>
          <a href="javascript:history.back()" className="btn-back">← Voltar</a>
        </main>

        <footer style={{
          padding: '1.25rem',
          textAlign: 'center',
          color: imageUrl ? 'rgba(255,255,255,0.6)' : '#94a3b8',
          fontSize: '0.8125rem',
          borderTop: imageUrl ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
          background: imageUrl ? 'rgba(0,0,0,0.25)' : '#fff',
          backdropFilter: imageUrl ? 'blur(8px)' : undefined,
        }}>
          © {year} {brandName}. Todos os direitos reservados.
        </footer>
      </body>
    </html>
  )
}
