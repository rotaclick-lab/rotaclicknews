'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

let cachedLogoUrl: string | null = null
let cachedBrandName: string | null = null

async function fetchBrandSettings() {
  if (cachedLogoUrl !== null) return { logoUrl: cachedLogoUrl, brandName: cachedBrandName ?? 'RotaClick' }
  try {
    const res = await fetch('/api/admin/platform-settings', { next: { revalidate: 60 } })
    const json = await res.json()
    cachedLogoUrl = json?.data?.brand_logo_url ?? ''
    cachedBrandName = json?.data?.brand_name ?? 'RotaClick'
  } catch {
    cachedLogoUrl = ''
    cachedBrandName = 'RotaClick'
  }
  return { logoUrl: cachedLogoUrl!, brandName: cachedBrandName! }
}

export function Logo({
  width = 160,
  height = 50,
  className = 'h-10 w-auto object-contain',
  priority = false,
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [brandName, setBrandName] = useState<string>('RotaClick')

  useEffect(() => {
    fetchBrandSettings().then(({ logoUrl: url, brandName: name }) => {
      setLogoUrl(url)
      setBrandName(name)
    })
  }, [])

  const src = logoUrl || '/logo.png'

  return (
    <Image
      src={src}
      alt={brandName}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={!!logoUrl}
    />
  )
}
