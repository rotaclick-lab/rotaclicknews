/**
 * Site Configuration
 * Centralized configuration for SEO, metadata, and site-wide settings
 */

import type { Metadata } from 'next';

export const siteConfig = {
  name: 'RotaClick',
  description: 'Plataforma SaaS completa para gestão de fretes',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/rotaclick',
    github: 'https://github.com/rotaclick-lab',
  },
  creator: 'RotaClick Lab',
};

export const metadataConfig: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'gestão de fretes',
    'transportadora',
    'logística',
    'transporte',
    'rastreamento',
    'cálculo de frete',
    'saas',
    'brasil',
  ],
  authors: [
    {
      name: siteConfig.creator,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.creator,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@rotaclick',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
