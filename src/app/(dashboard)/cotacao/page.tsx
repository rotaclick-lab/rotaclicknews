'use client'

import { useState } from 'react'
import { Plus, Package, MapPin, Flag, Calculator, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CargoItem {
  quantity: number
  weight: number
  height: number
  width: number
  depth: number
}

export default function CotacaoPage() {
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

  const [items, setItems] = useState<CargoItem[]>([
    { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 },
  ])

  const addItem = () => {
    setItems([...items, { quantity: 1, weight: 0, height: 0, width: 0, depth: 0 }])
  }

  const updateItem = (index: number, field: keyof CargoItem, value: number) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const calculateFreight = () => {
    // TODO: Implementar cálculo de frete
    alert('Funcionalidade de cálculo em desenvolvimento!')
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-3">Cotação de frete</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Informe os dados da carga abaixo para obter as melhores ofertas de transportadoras em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  1. Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input
                      placeholder="Digite seu nome"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="exemplo@email.com"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Fone</Label>
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Origin and Destination */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-500 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  2. Origem e Destino
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CEP de Origem</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="00000-000"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CEP de Destino</Label>
                    <div className="relative">
                      <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="00000-000"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Cargo Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  3. Detalhes da Carga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria do Produto</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={cargo.category}
                      onChange={(e) => setCargo({ ...cargo, category: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="eletronicos">Eletrônicos</option>
                      <option value="alimentos">Alimentos</option>
                      <option value="moveis">Móveis</option>
                      <option value="vestuario">Vestuário</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Produto</Label>
                    <Input
                      placeholder="Ex: Notebooks, Mesas..."
                      value={cargo.productType}
                      onChange={(e) => setCargo({ ...cargo, productType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Valor da Nota Fiscal</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                        R$
                      </span>
                      <Input
                        type="number"
                        className="pl-12 font-semibold"
                        placeholder="0,00"
                        value={cargo.invoiceValue}
                        onChange={(e) => setCargo({ ...cargo, invoiceValue: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  4. Dimensões dos Produtos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        className="text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="text-center"
                        placeholder="0.0"
                        value={item.weight || ''}
                        onChange={(e) => updateItem(index, 'weight', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Altura (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-center"
                        placeholder="0.00"
                        value={item.height || ''}
                        onChange={(e) => updateItem(index, 'height', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Largura (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-center"
                        placeholder="0.00"
                        value={item.width || ''}
                        onChange={(e) => updateItem(index, 'width', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Prof. (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-center"
                        placeholder="0.00"
                        value={item.depth || ''}
                        onChange={(e) => updateItem(index, 'depth', Number(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={addItem} className="text-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outro item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Summary Card */}
              <Card className="bg-[#1a242f] text-white border-none">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-black mb-6">Resumo da Cotação</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Origem</span>
                      <span className="font-medium">{origin || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Destino</span>
                      <span className="font-medium">{destination || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Itens</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                  </div>
                  <Button
                    onClick={calculateFreight}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-black"
                  >
                    <Calculator className="h-5 w-5 mr-3" />
                    Calcular Frete
                  </Button>
                  <p className="text-xs text-center text-gray-400 mt-4">
                    Ao clicar em calcular, você concorda com nossos Termos de Serviço.
                  </p>
                </CardContent>
              </Card>

              {/* Tip Card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dica RotaClick
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Certifique-se de que as dimensões estão em metros (ex: 100cm = 1.00m) para obter o cálculo exato
                    do peso cubado.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
