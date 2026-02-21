import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthRecoveryHandler } from '@/components/auth/auth-recovery-handler';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { createAdminClient } from '@/lib/supabase/admin';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'RotaClick - Gestão de Fretes',
  description: 'Plataforma de gestão de fretes para pequenas transportadoras',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

async function getPlatformTheme(): Promise<Record<string, string>> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('platform_settings')
      .select('key, value')
      .in('key', ['primary_color', 'secondary_color'])
    if (!data) return {}
    return Object.fromEntries(data.map((r: any) => [r.key, r.value]))
  } catch {
    return {}
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeSettings = await getPlatformTheme()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${manrope.variable}`}>
        <ThemeProvider settings={themeSettings}>
          <AuthRecoveryHandler />
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
