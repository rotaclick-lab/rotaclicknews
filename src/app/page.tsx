'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Package, MapPin, Calculator, ChevronRight, ChevronLeft, CheckCircle2, CreditCard, Truck, Calendar, UserCircle, ChevronDown, LayoutDashboard, LogOut, Sparkles, FileText, MessageSquare, PenLine, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/stripe-actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AiChatWidget } from '@/components/ai-chat-widget'
import { NfScanner } from '@/components/nf-scanner'

interface CargoItem {
  quantity: number
  weight: number
  height: number
  width: number
  depth: number
}

const PENDING_CHECKOUT_KEY = 'rotaclick_pending_checkout_offer'

interface QuoteResult {
  id: string
  carrier: string
  carrierId?: string | null
  logoUrl?: string | null
  price: number
  deadline: string
  deadlineDays?: number | null
  type: string
}

const DEMO_OFFER: QuoteResult = {
  id: 'demo-offer-001',
  carrier: 'Transportadora Demo',
  price: 157.5,
  deadline: '2 dias uteis',
  type: 'Simulacao',
}

type CampaignBanner = {
  id: string
  title: string
  description: string | null
  type: string
  image_url: string | null
  link_url: string | null
  link_label: string | null
  bg_color: string | null
  text_color: string | null
  slug: string | null
}

type BgImage = { name: string; url: string; path: string }

const BG_CACHE_KEY = 'rc_bg'
const BG_CACHE_TTL = 15 * 60 * 1000 // 15 min

function useRandomBg() {
  const [bgUrl, setBgUrl] = useState('/images/bg.webp')
  const [bgReady, setBgReady] = useState(false)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
    const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

    const applyUrl = (url: string) => {
      const img = new window.Image()
      img.onload = () => { setBgUrl(url); setBgReady(true) }
      img.onerror = () => setBgReady(true)
      img.src = url
    }

    // Tentar cache primeiro
    try {
      const raw = sessionStorage.getItem(BG_CACHE_KEY)
      if (raw) {
        const c = JSON.parse(raw) as { url: string; device: string; ts: number }
        if (c.device === device && Date.now() - c.ts < BG_CACHE_TTL && c.url) {
          applyUrl(c.url)
          return
        }
      }
    } catch { /* ignora */ }

    fetch('/api/admin/bg-images')
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.success) { setBgReady(true); return }
        const grouped = payload.data as Record<string, BgImage[]>
        let list: BgImage[] = grouped[device] ?? []
        if (list.length === 0 && device !== 'desktop') list = grouped['desktop'] ?? []
        if (list.length === 0) { setBgReady(true); return }
        const picked = list[Math.floor(Math.random() * list.length)]
        if (picked?.url) {
          try { sessionStorage.setItem(BG_CACHE_KEY, JSON.stringify({ url: picked.url, device, ts: Date.now() })) } catch { /* ignora */ }
          applyUrl(picked.url)
        } else {
          setBgReady(true)
        }
      })
      .catch(() => setBgReady(true))
  }, [])

  return { bgUrl, bgReady }
}

interface AuthUser {
  name: string
  email: string
  avatarUrl: string
  role: string
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemoMode = searchParams.get('demo') === '1'
  const { bgUrl, bgReady } = useRandomBg()

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { setAuthLoading(false); return }
      const meta = u.user_metadata ?? {}
      supabase.from('profiles').select('full_name, avatar_url, role, phone').eq('id', u.id).single()
        .then(({ data: p }) => {
          const name = p?.full_name || meta.full_name || meta.name || u.email?.split('@')[0] || 'Usuário'
          const email = u.email ?? ''
          const phone = p?.phone || meta.phone || ''
          setAuthUser({
            name,
            email,
            avatarUrl: p?.avatar_url || meta.avatar_url || '',
            role: p?.role || meta.role || 'cliente',
          })
          setContact({ name, email, phone })
          if (name && email) {
            setStep(2)
          }
          setAuthLoading(false)
        })
    })
  }, [])

  useEffect(() => {
    if (!headerMenuOpen) return
    const handler = () => setHeaderMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [headerMenuOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthUser(null)
    setHeaderMenuOpen(false)
    router.refresh()
  }

  const [step, setStep] = useState(1)
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [contactErrors, setContactErrors] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const validateContact = () => {
    const errors = { name: '', email: '', phone: '' }
    let valid = true

    if (!contact.name.trim() || contact.name.trim().split(' ').length < 2) {
      errors.name = 'Informe seu nome completo (nome e sobrenome)'
      valid = false
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!contact.email.trim() || !emailRe.test(contact.email.trim())) {
      errors.email = 'Informe um e-mail válido'
      valid = false
    }

    const phoneDigits = contact.phone.replace(/\D/g, '')
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
      errors.phone = 'Informe um telefone/WhatsApp válido com DDD'
      valid = false
    }

    setContactErrors(errors)
    return valid
  }

  const saveLead = (name: string, email: string, phone: string) => {
    fetch('/api/quotes/funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactName: name, contactEmail: email, contactPhone: phone }),
    }).catch(() => {})
  }

  const handleAiFill = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/parse-freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeText: aiText }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error('Não foi possível interpretar. Tente novamente.')
        return
      }
      const d = json.data
      const fmt = (cep: string) => { const c = cep.replace(/\D/g, '').slice(0, 8); return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : c }
      if (d.originCep) setOrigin(fmt(d.originCep))
      if (d.destCep) setDestination(fmt(d.destCep))
      if (d.weight != null) setItems([{ quantity: 1, weight: d.weight, height: 0, width: 0, depth: 0 }])
      if (d.invoiceValue != null) setCargo((prev) => ({ ...prev, invoiceValue: d.invoiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }))
      if (d.category) setCargo((prev) => ({ ...prev, category: d.category }))
      if (d.confidence === 'low') toast.info('Alguns campos não foram identificados — verifique e complete os dados.')
      else toast.success('Campos preenchidos! Verifique e complete se necessário.')
      setFillMode('manual')
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setAiLoading(false)
    }
  }

  const [fillMode, setFillMode] = useState<null | 'nf' | 'ai' | 'manual'>(null)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [originCity, setOriginCity] = useState<string | null>(null)
  const [destinationCity, setDestinationCity] = useState<string | null>(null)
  const [originCepLoading, setOriginCepLoading] = useState(false)
  const [destinationCepLoading, setDestinationCepLoading] = useState(false)
  const [originCepNotFound, setOriginCepNotFound] = useState(false)
  const [destinationCepNotFound, setDestinationCepNotFound] = useState(false)

  const [cargo, setCargo] = useState({
    category: '',
    productType: '',
    invoiceValue: '',
  })

  // Funções de Máscara
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const maskCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const numberValue = Number(cleanValue) / 100
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
    }).format(numberValue)
  }

  const maskDecimal = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const numberValue = Number(cleanValue) / 100
    return numberValue.toFixed(2)
  }

  const parseCurrencyInput = (value: string) => {
    const normalized = value.replace(/\./g, '').replace(',', '.').trim()
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const [items, setItems] = useState<CargoItem[]>([
    { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 },
  ])
  const [campaigns, setCampaigns] = useState<CampaignBanner[]>([])

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((payload) => { if (payload.success) setCampaigns(payload.data ?? []) })
      .catch(() => {})
  }, [])

  const [results, setResults] = useState<QuoteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<QuoteResult | null>(null)
  const [demoPaymentDone, setDemoPaymentDone] = useState(false)
  const [carrierPlaceholderUrl, setCarrierPlaceholderUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/platform-settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success && data.data?.carrier_placeholder_image_url) {
          setCarrierPlaceholderUrl(data.data.carrier_placeholder_image_url)
        }
      })
      .catch(() => {})
  }, [])

  const savePendingCheckout = useCallback((offer: QuoteResult) => {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(offer))
  }, [])

  const clearPendingCheckout = useCallback(() => {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
  }, [])

  useEffect(() => {
    if (searchParams.get('resumeCheckout') !== '1') return

    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!raw) return

    try {
      const offer = JSON.parse(raw) as QuoteResult
      if (!offer?.id) return

      setResults([offer])
      setSelectedOffer(offer)
      setStep(3)
      router.replace('/')
    } catch {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    }
  }, [router, searchParams])

  useEffect(() => {
    const digits = origin.replace(/\D/g, '')
    if (digits.length !== 8) {
      setOriginCity(null)
      setOriginCepNotFound(false)
      return
    }
    let cancelled = false
    setOriginCepLoading(true)
    setOriginCity(null)
    setOriginCepNotFound(false)
    fetch(`/api/viacep/${digits}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (cancelled) return
        if (data.localidade) {
          setOriginCity(`${data.localidade}/${data.uf || ''}`)
        } else {
          setOriginCepNotFound(true)
        }
      })
      .catch(() => { if (!cancelled) setOriginCepNotFound(true) })
      .finally(() => { if (!cancelled) setOriginCepLoading(false) })
    return () => { cancelled = true }
  }, [origin])

  useEffect(() => {
    const digits = destination.replace(/\D/g, '')
    if (digits.length !== 8) {
      setDestinationCity(null)
      setDestinationCepNotFound(false)
      return
    }
    let cancelled = false
    setDestinationCepLoading(true)
    setDestinationCity(null)
    setDestinationCepNotFound(false)
    fetch(`/api/viacep/${digits}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (cancelled) return
        if (data.localidade) {
          setDestinationCity(`${data.localidade}/${data.uf || ''}`)
        } else {
          setDestinationCepNotFound(true)
        }
      })
      .catch(() => { if (!cancelled) setDestinationCepNotFound(true) })
      .finally(() => { if (!cancelled) setDestinationCepLoading(false) })
    return () => { cancelled = true }
  }, [destination])

  const addItem = () => {
    setItems([...items, { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 }])
  }

  const updateItem = (index: number, field: keyof CargoItem, value: number) => {
    const newItems = [...items]
    const targetItem = newItems[index]
    if (!targetItem) return
    targetItem[field] = value
    setItems(newItems)
  }

  const calculateTotals = () => {
    let totalWeight = 0
    let totalCubedWeight = 0

    items.forEach(item => {
      const weight = item.weight * item.quantity
      // Dimensões em cm → converter para metros antes de calcular cubagem (fator NTC 300)
      const cubedWeight = (item.height / 100) * (item.width / 100) * (item.depth / 100) * 300 * item.quantity
      totalWeight += weight
      totalCubedWeight += cubedWeight
    })

    return {
      realWeight: totalWeight,
      cubedWeight: totalCubedWeight,
      taxableWeight: Math.max(totalWeight, totalCubedWeight),
    }
  }

  const handleCalculate = async () => {
    if (isDemoMode) {
      setResults([DEMO_OFFER])
      setSelectedOffer(DEMO_OFFER)
      setStep(3)
      setDemoPaymentDone(false)
      toast.success('Simulacao de frete carregada para apresentacao.')
      return
    }

    setLoading(true)
    try {
      const totals = calculateTotals()
      const invoiceValue = parseCurrencyInput(cargo.invoiceValue)

      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originCep: origin,
          destinationCep: destination,
          taxableWeight: totals.realWeight,
          invoiceValue,
          // Envia dimensões totais em cm para a API recalcular peso cubado por dentro
          lengthCm: items.reduce((acc, i) => acc + i.depth * i.quantity, 0) / Math.max(items.length, 1),
          widthCm: items.reduce((acc, i) => acc + i.width * i.quantity, 0) / Math.max(items.length, 1),
          heightCm: items.reduce((acc, i) => acc + i.height * i.quantity, 0) / Math.max(items.length, 1),
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
        data?: QuoteResult[]
      }

      if (!response.ok || !payload.success) {
        toast.error(payload.error || 'Não foi possível calcular as ofertas agora.')
        return
      }

      const offers = payload.data ?? []

      setResults(offers)
      setSelectedOffer(offers[0] ?? null)
      setStep(3)

      if (offers.length === 0) {
        toast.info('Nenhuma tabela de frete encontrada para este par de CEP.')
      }
    } catch (error) {
      console.error('Erro ao calcular cotação:', error)
      toast.error('Erro inesperado ao calcular cotação.')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundImage: `url('${bgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        opacity: bgReady ? 1 : 0.98,
        transition: 'background-image 0.4s ease-in-out',
      }}
    >
      {/* Header Público */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Logo
              width={200}
              height={64}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
          <nav className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-28 h-9 rounded-full bg-slate-100 animate-pulse" />
            ) : authUser ? (
              /* ── Usuário logado ── */
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-brand-100 bg-white pl-1.5 pr-3 py-1 hover:bg-brand-50 transition-colors shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
                    {authUser.avatarUrl ? (
                      <Image src={authUser.avatarUrl} alt="Avatar" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <UserCircle className="h-5 w-5 text-brand-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[90px] truncate">
                    {authUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${headerMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {headerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white shadow-xl py-1 z-50">
                    {/* Info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{authUser.name}</p>
                      <p className="text-xs text-slate-400 truncate">{authUser.email}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-semibold rounded-full px-2.5 py-0.5 uppercase tracking-wide ${
                        authUser.role === 'transportadora' ? 'bg-blue-50 text-blue-600'
                        : authUser.role === 'admin' ? 'bg-red-50 text-red-600'
                        : 'bg-brand-50 text-brand-600'
                      }`}>
                        {authUser.role === 'transportadora' ? 'Transportadora' : authUser.role === 'admin' ? 'Admin' : 'Embarcador'}
                      </span>
                    </div>
                    {/* Links */}
                    <Link
                      href={authUser.role === 'transportadora' ? '/dashboard' : authUser.role === 'admin' ? '/admin' : '/cliente'}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setHeaderMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand-500" />
                      Meu Painel
                    </Link>
                    {authUser.role === 'cliente' && (
                      <Link
                        href="/cliente/perfil"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setHeaderMenuOpen(false)}
                      >
                        <UserCircle className="h-4 w-4 text-slate-400" />
                        Meu Perfil
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Visitante ── */
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-brand-700 hover:text-brand-800 hover:bg-brand-50">Entrar</Button>
                </Link>
                <Link href="/transportadora">
                  <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold">Sou Transportadora</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero + Cotação */}
      <main className="flex-1">
        {/* Campanhas */}
        {campaigns.length > 0 && (
          <div className="w-full max-w-[1000px] mx-auto px-4 pt-4 space-y-2">
            {campaigns.map((c) => {
              const href = c.slug ? `/campanhas/${c.slug}` : c.link_url ?? undefined
              return (
                <div key={c.id} className="w-full rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: c.bg_color ?? '#2BBCB3' }}>
                  <div className="flex items-center justify-between gap-4 px-6 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {c.image_url && (
                        <div className="relative h-10 w-16 rounded overflow-hidden flex-shrink-0">
                          <Image src={c.image_url} alt="" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: c.text_color ?? '#fff' }}>{c.title}</p>
                        {c.description && <p className="text-xs opacity-80 truncate" style={{ color: c.text_color ?? '#fff' }}>{c.description}</p>}
                      </div>
                    </div>
                    {href && (
                      <a href={href} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" style={{ color: c.text_color ?? '#fff' }}>
                        {c.link_label ?? 'Saiba mais'}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* Título */}
        <div className="text-center pt-10 pb-4 px-6">
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight text-brand-800"
            style={{ textShadow: '0 0 4px #fff, 0 0 8px #fff, 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}
          >
            Cotação de Frete <span className="text-orange-500">Online</span>
          </h1>
          <p
            className="text-muted-foreground mt-2 max-w-[600px] mx-auto"
            style={{ textShadow: '0 0 4px #fff, 0 0 8px #fff, 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}
          >
            Compare preços de transportadoras em segundos. Preencha os dados abaixo e receba as melhores ofertas.
          </p>
        </div>

        {/* Formulário de Cotação */}
        <div className="w-full max-w-[1000px] mx-auto px-6 py-8 pb-20">
          {/* Progress Stepper */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300",
                  step >= s ? "bg-brand-500 border-brand-500 text-white" : "bg-background border-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
                <span className="absolute -bottom-7 text-xs font-medium whitespace-nowrap text-muted-foreground">
                  {s === 1 ? 'Contato' : s === 2 ? 'Rota e Carga' : 'Ofertas'}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Step 1: Contact */}
            {step === 1 && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-brand-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-brand-500" />
                    Dados de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Nome e Sobrenome"
                        className={`focus-visible:ring-brand-500 ${contactErrors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                        value={contact.name}
                        onChange={(e) => {
                          setContact({...contact, name: e.target.value})
                          if (contactErrors.name) setContactErrors({...contactErrors, name: ''})
                        }}
                      />
                      {contactErrors.name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {contactErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail <span className="text-red-500">*</span></Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className={`focus-visible:ring-brand-500 ${contactErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                        value={contact.email}
                        onChange={(e) => {
                          setContact({...contact, email: e.target.value})
                          if (contactErrors.email) setContactErrors({...contactErrors, email: ''})
                        }}
                      />
                      {contactErrors.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {contactErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Telefone / WhatsApp <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        className={`focus-visible:ring-brand-500 ${contactErrors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                        value={contact.phone}
                        onChange={(e) => {
                          setContact({...contact, phone: maskPhone(e.target.value)})
                          if (contactErrors.phone) setContactErrors({...contactErrors, phone: ''})
                        }}
                      />
                      {contactErrors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {contactErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <AiChatWidget
                      inline
                      onFillForm={(data) => {
                        setContact({
                          name: data.name,
                          email: data.email,
                          phone: data.phone,
                        })
                        const fmt = (cep: string) => {
                          const d = cep.replace(/\D/g, '').slice(0, 8)
                          return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
                        }
                        setOrigin(fmt(data.originCep))
                        setDestination(fmt(data.destCep))
                        setItems([{ quantity: data.quantity ?? 1, weight: data.weight, height: 0, width: 0, depth: 0 }])
                        setCargo((prev) => ({
                          ...prev,
                          invoiceValue: data.invoiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                        }))
                        setStep(2)
                      }}
                    />
                    <Button
                      className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                      onClick={() => {
                        if (validateContact()) {
                          saveLead(contact.name, contact.email, contact.phone)
                          setFillMode(null)
                          setStep(2)
                        }
                      }}
                    >
                      Próximo Passo <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Route + Cargo */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* Tela de escolha */}
                {fillMode === null && (
                  <Card className="border-brand-100 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-brand-500" />
                        Como deseja preencher os dados do frete?
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Escolha a forma mais prática para você</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <button
                        onClick={() => setFillMode('nf')}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-orange-200 bg-orange-50/40 hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                          <FileText className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-2">
                            Escanear Nota Fiscal
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Recomendado</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">CEPs, peso e valor preenchidos automaticamente pela IA</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setFillMode('ai')}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                          <MessageSquare className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Descrever com IA</p>
                          <p className="text-xs text-gray-500 mt-1">Descreva o frete em uma frase e a IA preenche os campos</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setFillMode('manual')}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 bg-gray-50/40 hover:border-gray-400 hover:bg-gray-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                          <PenLine className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Preencher manualmente</p>
                          <p className="text-xs text-gray-500 mt-1">Informe origem, destino e detalhes da carga nos campos</p>
                        </div>
                      </button>
                    </CardContent>
                    <div className="px-6 pb-4">
                      <button onClick={() => { setStep(1); setFillMode(null) }} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
                        <ChevronLeft className="h-4 w-4" /> Voltar para dados de contato
                      </button>
                    </div>
                  </Card>
                )}

                {/* Modo: NF Scanner */}
                {fillMode === 'nf' && (
                  <>
                    <Card className="border-orange-300 bg-white shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-5 w-5 text-orange-500" />
                            Escanear Nota Fiscal
                          </CardTitle>
                          <button onClick={() => setFillMode(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Trocar método</button>
                        </div>
                        <p className="text-sm text-muted-foreground">Envie a foto ou PDF da sua NF — preencheremos CEPs, peso e valor automaticamente.</p>
                      </CardHeader>
                      <CardContent>
                        <NfScanner
                          onExtracted={(data) => {
                            if (data.weight != null) setItems([{ quantity: data.quantity ?? 1, weight: data.weight, height: 0, width: 0, depth: 0 }])
                            if (data.invoiceValue != null) setCargo((prev) => ({ ...prev, invoiceValue: data.invoiceValue!.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }))
                            if (data.originCep) { const d = data.originCep.replace(/\D/g, '').slice(0, 8); if (d.length === 8) setOrigin(`${d.slice(0, 5)}-${d.slice(5)}`) }
                            if (data.destCep) { const d = data.destCep.replace(/\D/g, '').slice(0, 8); if (d.length === 8) setDestination(`${d.slice(0, 5)}-${d.slice(5)}`) }
                            setFillMode('manual')
                          }}
                        />
                      </CardContent>
                    </Card>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex-1 h-px bg-border" />
                      <span>confirme ou complete os dados abaixo</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  </>
                )}

                {/* Modo: IA texto livre */}
                {fillMode === 'ai' && (
                  <>
                    <Card className="border-blue-300 bg-white shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            Descrever com IA
                          </CardTitle>
                          <button onClick={() => setFillMode(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Trocar método</button>
                        </div>
                        <p className="text-sm text-muted-foreground">Descreva o frete em linguagem natural — a IA extrai os dados automaticamente.</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <textarea
                          className="w-full rounded-lg border border-blue-200 bg-blue-50/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                          rows={3}
                          placeholder='Ex: "30kg de eletrônicos de São Paulo para Belo Horizonte, nota fiscal de R$ 2.000"'
                          value={aiText}
                          onChange={(e) => setAiText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiFill() } }}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">Pressione Enter para enviar</p>
                          <Button
                            onClick={handleAiFill}
                            disabled={aiLoading || !aiText.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            {aiLoading ? 'Interpretando...' : 'Preencher com IA'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Campos manuais — visíveis nos modos 'manual' e 'nf' (após scan) */}
                {(fillMode === 'manual' || fillMode === 'nf') && (
                  <>

                <Card className="border-brand-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      Origem e Destino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>CEP de Origem</Label>
                        <Input 
                          placeholder="00000-000" 
                          className="focus-visible:ring-brand-500"
                          value={origin} 
                          onChange={(e) => setOrigin(maskCEP(e.target.value))} 
                        />
                        {origin.replace(/\D/g, '').length === 8 && (
                          <p className="text-sm min-h-[1.25rem] text-foreground/80">
                            {originCepLoading ? 'Buscando...' : originCity ?? (originCepNotFound ? 'CEP não encontrado' : null)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>CEP de Destino</Label>
                        <Input 
                          placeholder="00000-000" 
                          className="focus-visible:ring-brand-500"
                          value={destination} 
                          onChange={(e) => setDestination(maskCEP(e.target.value))} 
                        />
                        {destination.replace(/\D/g, '').length === 8 && (
                          <p className="text-sm min-h-[1.25rem] text-foreground/80">
                            {destinationCepLoading ? 'Buscando...' : destinationCity ?? (destinationCepNotFound ? 'CEP não encontrado' : null)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-brand-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-brand-500" />
                      Detalhes da Carga
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          value={cargo.category}
                          onChange={(e) => setCargo({...cargo, category: e.target.value})}
                        >
                          <option value="">Selecione...</option>
                          <option value="eletronicos">Eletrônicos</option>
                          <option value="alimentos">Alimentos</option>
                          <option value="moveis">Móveis</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor da NF (R$)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input 
                            className="pl-9 focus-visible:ring-brand-500"
                            value={cargo.invoiceValue} 
                            onChange={(e) => setCargo({...cargo, invoiceValue: maskCurrency(e.target.value)})} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Itens e Dimensões</Label>
                      {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 border border-brand-100 rounded-lg bg-brand-50/30">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Qtd</Label>
                            <Input type="number" className="focus-visible:ring-brand-500" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Peso (kg)</Label>
                            <Input 
                              className="text-right focus-visible:ring-brand-500"
                              value={item.weight.toFixed(2)} 
                              onChange={(e) => updateItem(idx, 'weight', Number(maskDecimal(e.target.value)))} 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Alt (cm)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="text-right focus-visible:ring-brand-500"
                              value={item.height || ''}
                              onChange={(e) => updateItem(idx, 'height', Math.max(0, Number(e.target.value)))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Larg (cm)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="text-right focus-visible:ring-brand-500"
                              value={item.width || ''}
                              onChange={(e) => updateItem(idx, 'width', Math.max(0, Number(e.target.value)))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase">Prof (cm)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="text-right focus-visible:ring-brand-500"
                              value={item.depth || ''}
                              onChange={(e) => updateItem(idx, 'depth', Math.max(0, Number(e.target.value)))}
                            />
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={addItem} className="text-brand-600 hover:text-brand-700 hover:bg-brand-50">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                      </Button>
                    </div>

                    {/* Automatic Calculation Display */}
                    <div className="bg-brand-50 p-4 rounded-lg border border-brand-200 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Peso Real</p>
                        <p className="font-bold">{totals.realWeight.toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Peso Cubado</p>
                        <p className="font-bold">{totals.cubedWeight.toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-brand-600 uppercase font-bold">Peso Taxável</p>
                        <p className="font-black text-brand-600">{totals.taxableWeight.toFixed(2)} kg</p>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => { setStep(1); setFillMode(null) }} className="border-brand-200 text-brand-700 hover:bg-brand-50">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                      </Button>
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        onClick={handleCalculate}
                        disabled={loading || !origin || !destination || totals.taxableWeight === 0}
                      >
                        {loading ? 'Calculando...' : 'Ver Ofertas de Frete'} <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Offers & Results */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
                {results.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStep(2)
                          if (isDemoMode) setDemoPaymentDone(false)
                        }}
                        className="border-brand-200 text-brand-700 hover:bg-brand-50"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                      </Button>
                      <h2 className="text-2xl font-bold text-brand-800">Melhor Oferta Encontrada</h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep(2)
                        if (isDemoMode) setDemoPaymentDone(false)
                      }}
                      className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 text-sm"
                    >
                      Alterar Dados
                    </Button>
                  </div>
                )}

                {isDemoMode && (
                  <Card className={cn('border', demoPaymentDone ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
                    <CardContent className="p-4">
                      <p className={cn('text-sm font-medium', demoPaymentDone ? 'text-green-800' : 'text-amber-800')}>
                        {demoPaymentDone
                          ? 'Modo demonstracao: contratacao finalizada e pagamento aprovado (simulado).'
                          : 'Modo demonstracao ativo: frete e pagamento serao simulados para apresentacao ao cliente.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {results.length === 0 && (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-5xl">😔</div>
                    <p className="font-bold text-slate-700 text-lg">Nenhum frete encontrado</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Não encontramos tabelas de frete disponíveis para esta rota. Tente alterar os CEPs ou entre em contato conosco.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="border-brand-200 text-brand-700 hover:bg-brand-50 mt-2"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Alterar dados da rota
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {results.map((offer, index) => (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedOffer(offer)}
                      className={cn(
                        "cursor-pointer flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white/90 backdrop-blur-sm hover:shadow-lg group",
                        selectedOffer?.id === offer.id
                          ? "border-brand-500 shadow-md shadow-brand-100"
                          : "border-slate-200 hover:border-brand-300"
                      )}
                    >
                      {/* Logo */}
                      <div className={cn(
                        "w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden transition-all",
                        selectedOffer?.id === offer.id
                          ? "bg-brand-500 text-white ring-2 ring-brand-400 ring-offset-2"
                          : "bg-brand-50 text-brand-600 border-2 border-brand-100 group-hover:border-brand-300"
                      )}>
                        {offer.logoUrl ? (
                          <Image src={offer.logoUrl} alt={offer.carrier} width={56} height={56} className="w-full h-full object-contain p-1" />
                        ) : carrierPlaceholderUrl ? (
                          <Image src={carrierPlaceholderUrl} alt="Transportadora" width={56} height={56} className="w-full h-full object-contain p-2" />
                        ) : (
                          <Truck className="h-7 w-7" />
                        )}
                      </div>

                      {/* Info central */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-slate-800 truncate" title={offer.carrier}>
                            {offer.carrier}
                          </p>
                          {index === 0 && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
                              Melhor preço
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {offer.deadline}
                          </span>
                          <span className="flex items-center gap-1 text-brand-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Seguro Incluso
                          </span>
                        </div>
                      </div>

                      {/* Preço + botão */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest">Preço Final</p>
                        <p className="text-xl font-black text-orange-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(offer.price)}
                        </p>
                        <span className={cn(
                          "text-xs font-semibold px-3 py-1 rounded-full mt-1 inline-block transition-all",
                          selectedOffer?.id === offer.id
                            ? "bg-brand-500 text-white"
                            : "bg-brand-50 text-brand-600 group-hover:bg-brand-100"
                        )}>
                          {selectedOffer?.id === offer.id ? "Selecionado ✓" : "Selecionar"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedOffer && (
                  <div className="fixed bottom-0 left-0 w-full bg-background border-t border-brand-200 p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500 z-50">
                    <div className="max-w-[1000px] mx-auto flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Melhor proposta selecionada</p>
                        <p className="text-xl font-black text-orange-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOffer.price)}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-white px-10 font-bold"
                        onClick={async () => {
                          if (!selectedOffer) return

                          if (isDemoMode) {
                            setLoading(true)
                            await new Promise((resolve) => setTimeout(resolve, 900))
                            setLoading(false)
                            setDemoPaymentDone(true)
                            toast.success('Pagamento aprovado em modo demonstracao.')
                            return
                          }

                          setLoading(true)
                          const totals = calculateTotals()
                          const result = await createCheckoutSession(
                            {
                              ...selectedOffer,
                              originZip: origin.replace(/\D/g, ''),
                              destZip: destination.replace(/\D/g, ''),
                              taxableWeight: totals.taxableWeight,
                            },
                            undefined,
                            '/?resumeCheckout=1'
                          )

                          if (result.requiresAuth && result.loginUrl) {
                            savePendingCheckout(selectedOffer)
                            window.location.href = result.loginUrl
                            return
                          }

                          if (result.success && result.url) {
                            clearPendingCheckout()
                            window.location.href = result.url
                          } else {
                            toast.error(result.error || 'Erro ao processar pagamento')
                            setLoading(false)
                          }
                        }}
                        disabled={loading}
                      >
                        <CreditCard className="mr-2 h-5 w-5" /> {loading ? 'Processando...' : isDemoMode ? 'SIMULAR PAGAMENTO' : 'PAGAR E FINALIZAR AGORA'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-100 py-6 bg-white">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            <Logo
              width={130}
              height={41}
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/transportadora" className="hover:text-brand-600 transition-colors">Área da Transportadora</Link>
            <Link href="/cadastro" className="hover:text-brand-600 transition-colors">Cadastre-se</Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © 2025 RotaClick. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
