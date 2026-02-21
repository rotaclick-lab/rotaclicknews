'use client'

import { useEffect } from 'react'

interface ThemeProviderProps {
  settings: Record<string, string>
  children: React.ReactNode
}

export function ThemeProvider({ settings, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    if (settings.primary_color) {
      root.style.setProperty('--brand-primary', settings.primary_color)
    }
    if (settings.secondary_color) {
      root.style.setProperty('--brand-secondary', settings.secondary_color)
    }
  }, [settings])

  return <>{children}</>
}
