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
  const { imageUrl, primaryColor, brandName } =
    await getMaintenanceSettings()

  const year = new Date().getFullYear()

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sistema em Manutenção — {brandName}</title>
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
        {imageUrl && <div className="bg-layer" />}
        {imageUrl && <div className="bg-overlay" />}
        <main style={{ flex: 1 }} />

        {/* Footer */}
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
