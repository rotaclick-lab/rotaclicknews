'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, MapPin, Flag, Calculator, Info, ChevronRight, ChevronLeft, CheckCircle2, CreditCard, Truck, Ship, Plane, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/stripe-actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CargoItem {
  quantity: number
  weight: number
  height: number
  width: number
  depth: number
}

interface QuoteResult {
  id: string
  carrier: string
  price: number
  deadline: string
  type: string
}

export default function CotacaoPage() {
  const [step, setStep] = useState(1)
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

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

  const [items, setItems] = useState<CargoItem[]>([
    { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 },
  ])

  const [results, setResults] = useState<QuoteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<QuoteResult | null>(null)

  const addItem = () => {
    setItems([...items, { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 }])
  }

  const updateItem = (index: number, field: keyof CargoItem, value: number) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  // Lógica de Cálculo Automática
  const calculateTotals = () => {
    let totalWeight = 0
    let totalCubedWeight = 0
    
    items.forEach(item => {
      const weight = item.weight * item.quantity
      const cubedWeight = (item.height * item.width * item.depth) * 300 * item.quantity
      totalWeight += weight
      totalCubedWeight += cubedWeight
    })

    return {
      realWeight: totalWeight,
      cubedWeight: totalCubedWeight,
      taxableWeight: Math.max(totalWeight, totalCubedWeight)
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    // Simulação de chamada de API para obter fretes
    setTimeout(() => {
      const totals = calculateTotals()
      const basePrice = totals.taxableWeight * 2.5 + (Number(cargo.invoiceValue) * 0.01)
      
      const mockResults: QuoteResult[] = [
        { id: '1', carrier: 'RotaClick Express', price: basePrice, deadline: '2 dias úteis', type: 'Caminhão Baú' },
        { id: '2', carrier: 'Logística Brasil', price: basePrice * 0.8, deadline: '5 dias úteis', type: 'Carga Pesada' },
        { id: '3', carrier: 'Flash Entregas', price: basePrice * 1.2, deadline: '1 dia útil', type: 'VUC / Utilitário' },
      ]
      
      setResults(mockResults)
      setLoading(false)
      setStep(4)
    }, 1500)
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="w-full max-w-[1000px] mx-auto px-6 py-10">
        {/* Progress Stepper */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={cn(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300",
                step >= s ? "bg-primary border-primary text-white" : "bg-background border-muted text-muted-foreground"
              )}
            >
              {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
              <span className="absolute -bottom-7 text-xs font-medium whitespace-nowrap text-muted-foreground">
                {s === 1 ? 'Contato' : s === 2 ? 'Rota' : s === 3 ? 'Carga' : 'Ofertas'}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Step 1: Contact */}
          {step === 1 && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Dados de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input placeholder="Seu nome" value={contact.name} onChange={(e) => setContact({...contact, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@exemplo.com" value={contact.email} onChange={(e) => setContact({...contact, email: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={contact.phone} 
                      onChange={(e) => setContact({...contact, phone: maskPhone(e.target.value)})} 
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!contact.name || !contact.email}>
                    Próximo Passo <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Route */}
          {step === 2 && (
            <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
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
                      value={origin} 
                      onChange={(e) => setOrigin(maskCEP(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP de Destino</Label>
                    <Input 
                      placeholder="00000-000" 
                      value={destination} 
                      onChange={(e) => setDestination(maskCEP(e.target.value))} 
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!origin || !destination}>
                    Próximo Passo <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Cargo Details */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Detalhes da Carga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                          className="pl-9"
                          value={cargo.invoiceValue} 
                          onChange={(e) => setCargo({...cargo, invoiceValue: maskCurrency(e.target.value)})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Itens e Dimensões</Label>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Qtd</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Peso (kg)</Label>
                          <Input 
                            className="text-right"
                            value={item.weight.toFixed(2)} 
                            onChange={(e) => updateItem(idx, 'weight', Number(maskDecimal(e.target.value)))} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Alt (m)</Label>
                          <Input 
                            className="text-right"
                            value={item.height.toFixed(2)} 
                            onChange={(e) => updateItem(idx, 'height', Number(maskDecimal(e.target.value)))} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Larg (m)</Label>
                          <Input 
                            className="text-right"
                            value={item.width.toFixed(2)} 
                            onChange={(e) => updateItem(idx, 'width', Number(maskDecimal(e.target.value)))} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Prof (m)</Label>
                          <Input 
                            className="text-right"
                            value={item.depth.toFixed(2)} 
                            onChange={(e) => updateItem(idx, 'depth', Number(maskDecimal(e.target.value)))} 
                          />
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addItem} className="text-primary">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                    </Button>
                  </div>

                  {/* Automatic Calculation Display */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Peso Real</p>
                      <p className="font-bold">{totals.realWeight.toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Peso Cubado</p>
                      <p className="font-bold">{totals.cubedWeight.toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-primary uppercase font-bold">Peso Taxável</p>
                      <p className="font-black text-primary">{totals.taxableWeight.toFixed(2)} kg</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button onClick={handleCalculate} disabled={loading || totals.taxableWeight === 0}>
                      {loading ? 'Calculando...' : 'Ver Ofertas de Frete'} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Offers & Results */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Melhores Ofertas Encontradas</h2>
                <Button variant="ghost" onClick={() => setStep(3)}>Alterar Dados</Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {results.map((offer) => (
                  <Card 
                    key={offer.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg border-2 relative overflow-hidden group",
                      selectedOffer?.id === offer.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    )}
                    onClick={() => setSelectedOffer(offer)}
                  >
                    {/* Truck Animation Background */}
                    <div className="absolute -right-4 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Truck className="h-24 w-24 rotate-12" />
                    </div>

                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                          selectedOffer?.id === offer.id ? "bg-primary text-white" : "bg-muted text-primary"
                        )}>
                          <Truck className={cn(
                            "h-8 w-8",
                            offer.type.includes('Pesada') ? "h-10 w-10" : "h-8 w-8"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl">{offer.carrier}</h3>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {offer.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {offer.deadline}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Seguro Incluso
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right bg-background/50 p-3 rounded-xl border border-muted">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Preço Final</p>
                        <p className="text-3xl font-black text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(offer.price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedOffer && (
                <div className="fixed bottom-0 left-0 w-full bg-background border-t p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500 z-50">
                  <div className="max-w-[1000px] mx-auto flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Selecionado: <span className="font-bold text-foreground">{selectedOffer.carrier}</span></p>
                      <p className="text-xl font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOffer.price)}
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700 text-white px-10 font-bold"
                      onClick={async () => {
                        if (!selectedOffer) return
                        setLoading(true)
                        const result = await createCheckoutSession(selectedOffer)
                        if (result.success && result.url) {
                          window.location.href = result.url
                        } else {
                          toast.error(result.error || 'Erro ao processar pagamento')
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                    >
                      <CreditCard className="mr-2 h-5 w-5" /> {loading ? 'Processando...' : 'PAGAR E FINALIZAR AGORA'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
