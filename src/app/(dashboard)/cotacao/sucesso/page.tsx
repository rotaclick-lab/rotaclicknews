'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Printer, Download, Package, MapPin, Calendar, CreditCard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="w-full max-w-[800px] mx-auto px-6 py-10">
        {/* Success Header */}
        <div className="text-center mb-10 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground text-lg">
            Sua cotação foi finalizada e o frete já está sendo processado.
          </p>
        </div>

        {/* Receipt Card */}
        <Card id="receipt" className="border-2 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <CardHeader className="bg-brand-500 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-wider">Comprovante de Frete</CardTitle>
                <p className="text-white/80 text-sm mt-1">RotaClick - Gestão Inteligente de Logística</p>
              </div>
              <div className="text-right">
                <p className="font-bold">#{sessionId?.slice(-8).toUpperCase() || 'RC-88291'}</p>
                <p className="text-xs text-white/60">{date}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Status Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Pagamento via Cartão de Crédito aprovado com sucesso.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Route Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Rota do Transporte
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Origem</span>
                    <span className="font-semibold">CEP: 04571-010 - São Paulo, SP</span>
                  </div>
                  <div className="w-px h-4 bg-muted ml-2" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Destino</span>
                    <span className="font-semibold">CEP: 80010-000 - Curitiba, PR</span>
                  </div>
                </div>
              </div>

              {/* Cargo Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Detalhes da Carga
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="font-semibold">Eletrônicos</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso Taxável</p>
                    <p className="font-semibold">12.50 kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor NF</p>
                    <p className="font-semibold text-green-600">R$ 2.500,00</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prazo Est.</p>
                    <p className="font-semibold">2 dias úteis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Subtotal do Frete</span>
                <span>R$ 145,00</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Taxas e Impostos</span>
                <span>R$ 12,50</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed">
                <span className="text-lg font-bold">Total Pago</span>
                <span className="text-2xl font-black text-brand-600">R$ 157,50</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-[10px] text-muted-foreground text-center pt-4 italic">
              Este documento é um comprovante digital de contratação de serviço via plataforma RotaClick. 
              A transportadora será notificada imediatamente para coleta.
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex-1 py-6 font-bold">
            <Printer className="mr-2 h-5 w-5" /> Imprimir Comprovante
          </Button>
          <Button className="flex-1 py-6 font-bold bg-brand-500 hover:bg-brand-600 text-white">
            <Download className="mr-2 h-5 w-5" /> Baixar PDF
          </Button>
        </div>

        <div className="mt-10 text-center print:hidden">
          <Link href="/dashboard" className="text-brand-600 hover:underline flex items-center justify-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" /> Voltar para o Painel de Controle
          </Link>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando comprovante...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
