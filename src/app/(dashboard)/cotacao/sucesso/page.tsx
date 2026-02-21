'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Printer, Package, MapPin, CreditCard, ArrowLeft, Truck, Clock, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { getFreightBySessionId } from '@/app/actions/quotes-actions'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtCep = (v: string) => v ? `${v.slice(0,5)}-${v.slice(5)}` : '—'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [freight, setFreight] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    if (!sessionId) { setLoading(false); return }
    getFreightBySessionId(sessionId).then(res => {
      if (res.success) setFreight(res.data)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-muted-foreground">Verificando pagamento...</p>
      </div>
    )
  }

  const isPaid = freight?.payment_status === 'paid' || !freight
  const isFailed = freight?.payment_status === 'failed' || freight?.payment_status === 'expired'

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="w-full max-w-[800px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in zoom-in duration-700">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isFailed ? 'bg-red-100' : 'bg-green-100'}`}>
            {isFailed
              ? <XCircle className="h-12 w-12 text-red-600" />
              : <CheckCircle2 className="h-12 w-12 text-green-600" />}
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            {isFailed ? 'Pagamento não concluído' : 'Pagamento Confirmado!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isFailed
              ? 'Houve um problema com seu pagamento. Tente novamente.'
              : 'Sua cotação foi finalizada e o frete já está sendo processado.'}
          </p>
        </div>

        {isFailed ? (
          <div className="flex flex-col items-center gap-4">
            <Link href="/cotacao">
              <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white">Tentar novamente</Button>
            </Link>
            <Link href="/dashboard" className="text-brand-600 hover:underline text-sm">Voltar ao painel</Link>
          </div>
        ) : (
          <>
            <Card id="receipt" className="border-2 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
              <CardHeader className="bg-brand-500 text-white p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-wider">Comprovante de Frete</CardTitle>
                    <p className="text-white/80 text-sm mt-1">RotaClick — Gestão Inteligente de Logística</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">#{(freight?.id || sessionId)?.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-white/60">{date}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span className="font-medium">Pagamento aprovado com sucesso.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Rota do Transporte
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Origem</p>
                        <p className="font-semibold">CEP: {freight?.origin_zip ? fmtCep(freight.origin_zip) : '—'}</p>
                      </div>
                      <div className="w-px h-4 bg-muted ml-2" />
                      <div>
                        <p className="text-xs text-muted-foreground">Destino</p>
                        <p className="font-semibold">CEP: {freight?.dest_zip ? fmtCep(freight.dest_zip) : '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Transportadora
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Empresa</p>
                        <p className="font-semibold">{freight?.carrier_name || 'Transportadora'}</p>
                      </div>
                      {freight?.deadline_days && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Prazo estimado: <span className="font-medium text-foreground">{freight.deadline_days} dias úteis</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-lg font-bold">Total Pago</span>
                    <span className="text-3xl font-black text-brand-600">
                      {freight?.price ? fmt(Number(freight.price)) : '—'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground text-center pt-2 italic">
                  Este documento é um comprovante digital de contratação de serviço via plataforma RotaClick.
                  A transportadora será notificada imediatamente para coleta.
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center print:hidden">
              <Button onClick={() => window.print()} variant="outline" className="flex-1 py-6 font-bold">
                <Printer className="mr-2 h-5 w-5" /> Imprimir Comprovante
              </Button>
              <Link href="/historico" className="flex-1">
                <Button className="w-full py-6 font-bold bg-brand-500 hover:bg-brand-600 text-white">
                  <Package className="mr-2 h-5 w-5" /> Ver Meus Fretes
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-center print:hidden">
              <Link href="/dashboard" className="text-brand-600 hover:underline flex items-center justify-center gap-2 font-medium">
                <ArrowLeft className="h-4 w-4" /> Voltar para o Painel
              </Link>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
