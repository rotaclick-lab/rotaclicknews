import { Route, Calendar, Truck, Repeat, Navigation } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import RotasRealizadasClient from './rotas-realizadas-client'

export default async function RotasRealizadasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Faça login para ver suas rotas.</p>
      </div>
    )
  }

  // Buscar fretes pagos do carrier logado
  const { data: freights } = await supabase
    .from('freights')
    .select('id, origin_zip, dest_zip, price, carrier_amount, created_at, payment_status')
    .eq('carrier_id', user.id)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })

  // Agrupar por par origem-destino
  const routeMap = new Map<string, {
    key: string
    origem: string
    destino: string
    vezesRealizada: number
    faturamentoTotal: number
    ultimaViagem: string
  }>()

  for (const f of freights ?? []) {
    const origem = f.origin_zip ?? '—'
    const destino = f.dest_zip ?? '—'
    const key = `${origem}→${destino}`
    const existing = routeMap.get(key)
    if (existing) {
      existing.vezesRealizada += 1
      existing.faturamentoTotal += Number(f.carrier_amount ?? f.price ?? 0)
      if (f.created_at > existing.ultimaViagem) existing.ultimaViagem = f.created_at
    } else {
      routeMap.set(key, {
        key,
        origem,
        destino,
        vezesRealizada: 1,
        faturamentoTotal: Number(f.carrier_amount ?? f.price ?? 0),
        ultimaViagem: f.created_at,
      })
    }
  }

  const rotas = Array.from(routeMap.values())

  const totalViagens = rotas.reduce((acc, r) => acc + r.vezesRealizada, 0)
  const rotaMaisFrequente = rotas.length > 0
    ? rotas.reduce((prev, curr) => curr.vezesRealizada > prev.vezesRealizada ? curr : prev)
    : null

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Route className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{rotas.length}</p>
                <p className="text-xs text-muted-foreground">Rotas Diferentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalViagens}</p>
                <p className="text-xs text-muted-foreground">Fretes Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <Repeat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                {rotaMaisFrequente ? (
                  <>
                    <p className="text-sm font-bold text-brand-800 truncate">
                      {rotaMaisFrequente.origem} → {rotaMaisFrequente.destino}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Rota ({rotaMaisFrequente.vezesRealizada}x)</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista interativa (client component para busca/ordenação) */}
      <RotasRealizadasClient
        rotas={rotas.map(r => ({
          ...r,
          faturamentoFormatado: fmt(r.faturamentoTotal),
          ultimaViagemFormatada: fmtDate(r.ultimaViagem),
        }))}
      />
    </div>
  )
}
