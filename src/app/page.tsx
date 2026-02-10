import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Truck, MapPin, DollarSign, BarChart3, Users, Car } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/rotaclick-logo.png"
              alt="RotaClick"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold text-brand-700">Rota<span className="text-orange-500">Click</span></span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-brand-700 hover:text-brand-800 hover:bg-brand-50">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold">Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Truck className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Gestão de Fretes
            <br />
            <span className="text-brand-500">Simples e <span className="text-orange-500">Eficiente</span></span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            Sistema completo para transportadoras gerenciarem fretes, veículos,
            motoristas e financeiro em um só lugar.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/registro">
              <Button size="lg" className="h-12 px-8 bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Começar Agora - Grátis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 border-brand-300 text-brand-700 hover:bg-brand-50">
                Fazer Login
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-brand-100 bg-brand-50/50 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold text-brand-800">
              Tudo que você precisa
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Truck,
                  title: 'Gestão de Fretes',
                  description: 'Controle completo de entregas, rotas e status em tempo real',
                  iconColor: 'text-brand-600',
                  bgColor: 'bg-brand-100',
                },
                {
                  icon: Users,
                  title: 'Motoristas e Clientes',
                  description: 'Cadastro e gestão de motoristas e base de clientes',
                  iconColor: 'text-orange-500',
                  bgColor: 'bg-orange-100',
                },
                {
                  icon: Car,
                  title: 'Controle de Frota',
                  description: 'Gerencie todos os seus veículos em um só lugar',
                  iconColor: 'text-brand-600',
                  bgColor: 'bg-brand-100',
                },
                {
                  icon: MapPin,
                  title: 'Marketplace',
                  description: 'Encontre ofertas de frete de retorno e otimize rotas',
                  iconColor: 'text-orange-500',
                  bgColor: 'bg-orange-100',
                },
                {
                  icon: DollarSign,
                  title: 'Financeiro',
                  description: 'Controle de receitas, despesas e fluxo de caixa',
                  iconColor: 'text-brand-600',
                  bgColor: 'bg-brand-100',
                },
                {
                  icon: BarChart3,
                  title: 'Relatórios',
                  description: 'Análises detalhadas e insights do seu negócio',
                  iconColor: 'text-orange-500',
                  bgColor: 'bg-orange-100',
                },
              ].map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 text-center shadow-sm border border-brand-100 hover:shadow-md transition-shadow"
                  >
                    <div className={`rounded-full ${feature.bgColor} p-3`}>
                      <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-800">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-brand-100 py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-12 text-center text-white">
              <h2 className="mb-4 text-3xl font-bold">
                Pronto para começar?
              </h2>
              <p className="mb-8 text-lg opacity-90">
                Cadastre-se agora e comece a gerenciar seus fretes de forma profissional
              </p>
              <Link href="/registro">
                <Button size="lg" className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-100 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/rotaclick-logo.png"
              alt="RotaClick"
              width={24}
              height={24}
              className="h-6 w-6 rounded object-contain"
            />
            <span className="font-semibold text-brand-700">Rota<span className="text-orange-500">Click</span></span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © 2025 RotaClick. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
