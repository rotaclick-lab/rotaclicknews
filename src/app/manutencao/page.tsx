async function getMaintenanceSettings(): Promise<{
  title: string
  message: string
  imageUrl: string
  primaryColor: string
  logoUrl: string
  brandName: string
}> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_settings?key=in.(maintenance_title,maintenance_message,maintenance_image_url,brand_primary_color,brand_logo_url,brand_name)&select=key,value`,
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
      title: map['maintenance_title'] || 'Sistema em Manutenção',
      message: map['maintenance_message'] || 'Estamos realizando melhorias. Voltamos em breve!',
      imageUrl: map['maintenance_image_url'] || '',
      primaryColor: map['brand_primary_color'] || '#2BBCB3',
      logoUrl: map['brand_logo_url'] || '',
      brandName: map['brand_name'] || 'RotaClick',
    }
  } catch {
    return {
      title: 'Sistema em Manutenção',
      message: 'Estamos realizando melhorias. Voltamos em breve!',
      imageUrl: '',
      primaryColor: '#2BBCB3',
      logoUrl: '',
      brandName: 'RotaClick',
    }
  }
}

export default async function ManutencaoPage() {
  const { title, message, imageUrl, primaryColor, logoUrl, brandName } =
    await getMaintenanceSettings()

  const year = new Date().getFullYear()

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — {brandName}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #fef3c7 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          @keyframes progress {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
          @keyframes pulse-ring {
            0%   { transform: scale(0.95); opacity: 1; }
            70%  { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(0.95); opacity: 0; }
          }
          .progress-bar {
            height: 100%;
            width: 28%;
            border-radius: 9999px;
            background: ${primaryColor};
            animation: progress 2s ease-in-out infinite;
          }
          .icon-ring {
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 3px solid ${primaryColor};
            animation: pulse-ring 2s ease-out infinite;
          }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <header style={{
          backgroundColor: primaryColor,
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

        {/* Main */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
            border: '1px solid #e2e8f0',
          }}>

            {/* Imagem ou ícone */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Manutenção"
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  marginBottom: '2rem',
                  borderRadius: '1rem',
                }}
              />
            ) : (
              <div style={{
                position: 'relative',
                width: '88px',
                height: '88px',
                margin: '0 auto 2rem',
              }}>
                <div className="icon-ring" />
                <div style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  backgroundColor: `${primaryColor}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                }}>
                  🔧
                </div>
              </div>
            )}

            {/* Título */}
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}>
              {title}
            </h1>

            {/* Mensagem */}
            <p style={{
              color: '#64748b',
              lineHeight: 1.75,
              fontSize: '1rem',
              marginBottom: '2.25rem',
              maxWidth: '380px',
              margin: '0 auto 2.25rem',
            }}>
              {message}
            </p>

            {/* Barra de progresso */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '9999px',
              height: '6px',
              overflow: 'hidden',
              marginBottom: '1.75rem',
            }}>
              <div className="progress-bar" />
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Agradecemos a sua compreensão 🙏
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '1.25rem',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.8125rem',
          borderTop: '1px solid #e2e8f0',
          background: '#fff',
        }}>
          © {year} {brandName}. Todos os direitos reservados.
        </footer>
      </body>
    </html>
  )
}
