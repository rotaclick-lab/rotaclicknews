'use client'

import { useState } from 'react'
import { Route, Calendar, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Rota {
  key: string
  origem: string
  destino: string
  vezesRealizada: number
  faturamentoTotal: number
  faturamentoFormatado: string
  ultimaViagem: string
  ultimaViagemFormatada: string
}

export default function RotasRealizadasClient({ rotas }: { rotas: Rota[] }) {
  const [busca, setBusca] = useState('')
  const [ordenar, setOrdenar] = useState<'frequencia' | 'faturamento' | 'recente'>('frequencia')

  const rotasFiltradas = rotas
    .filter(r => {
      if (!busca) return true
      return r.origem.toLowerCase().includes(busca.toLowerCase()) ||
        r.destino.toLowerCase().includes(busca.toLowerCase())
    })
    .sort((a, b) => {
      if (ordenar === 'frequencia') return b.vezesRealizada - a.vezesRealizada
      if (ordenar === 'faturamento') return b.faturamentoTotal - a.faturamentoTotal
      return b.ultimaViagem.localeCompare(a.ultimaViagem)
    })

  return (
    <>
      {/* Filtros */}
      <Card className="border-brand-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'frequencia' as const, label: 'Mais Frequentes' },
                { key: 'faturamento' as const, label: 'Maior Faturamento' },
                { key: 'recente' as const, label: 'Mais Recentes' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setOrdenar(f.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    ordenar === f.key
                      ? 'bg-brand-500 text-white'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rota..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 focus-visible:ring-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rotasFiltradas.length === 0 ? (
          <Card className="border-brand-100 md:col-span-2">
            <CardContent className="py-12 text-center">
              <Route className="h-12 w-12 text-brand-200 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {rotas.length === 0
                  ? 'Nenhum frete realizado ainda. Quando clientes pagarem fretes, eles aparecerão aqui.'
                  : 'Nenhuma rota encontrada para essa busca.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          rotasFiltradas.map((rota) => (
            <Card key={rota.key} className="border-brand-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                      <span className="text-sm font-bold text-brand-800">{rota.origem}</span>
                    </div>
                    <div className="ml-1.5 w-0.5 h-6 bg-gradient-to-b from-brand-300 to-orange-300 my-1" />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                      <span className="text-sm font-bold text-orange-700">{rota.destino}</span>
                    </div>
                  </div>
                  <div className="bg-brand-50 px-3 py-1.5 rounded-lg text-right">
                    <p className="text-lg font-black text-brand-700">{rota.vezesRealizada}x</p>
                    <p className="text-[10px] text-muted-foreground">realizadas</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Faturamento Total</p>
                    <p className="font-bold text-emerald-700">{rota.faturamentoFormatado}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Última viagem</p>
                    <p className="font-bold text-brand-800">{rota.ultimaViagemFormatada}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Última viagem: {rota.ultimaViagemFormatada}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
