'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, HelpCircle, Clock, Package, CreditCard, Truck, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const WHATSAPP_NUMBER = '5511999999999'
const SUPPORT_EMAIL = 'sac@rotaclick.com.br'

const faqs = [
  {
    icon: CreditCard,
    category: 'Pagamento',
    items: [
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos cartão de crédito e débito via nossa plataforma segura (Stripe). O pagamento é processado em tempo real e você recebe confirmação imediata.',
      },
      {
        q: 'Como recebo o comprovante de pagamento?',
        a: 'Após a confirmação do pagamento, você é redirecionado para a página de comprovante. Você também pode acessar seu histórico de fretes a qualquer momento em "Histórico de Fretes".',
      },
      {
        q: 'Posso cancelar um frete após o pagamento?',
        a: 'Para cancelamentos, entre em contato com nosso suporte imediatamente via WhatsApp ou email. A política de reembolso depende do estágio do frete.',
      },
    ],
  },
  {
    icon: Truck,
    category: 'Fretes e Cotações',
    items: [
      {
        q: 'Como funciona a cotação de frete?',
        a: 'Informe o CEP de origem, destino, peso e valor da nota fiscal. Nossa plataforma consulta automaticamente as tabelas das transportadoras parceiras e apresenta as melhores opções.',
      },
      {
        q: 'Quantas transportadoras participam da plataforma?',
        a: 'Trabalhamos com múltiplas transportadoras credenciadas em todo o Brasil. A disponibilidade varia conforme a rota e o peso da carga.',
      },
      {
        q: 'O prazo de entrega é garantido?',
        a: 'O prazo exibido na cotação é estimado pela transportadora com base na rota. Fatores externos como greves, feriados e condições climáticas podem afetar o prazo.',
      },
      {
        q: 'Como acompanho meu frete após o pagamento?',
        a: 'Acesse "Histórico de Fretes" para visualizar o status atualizado. A transportadora também pode fornecer código de rastreio diretamente.',
      },
    ],
  },
  {
    icon: Package,
    category: 'Comprovantes de Entrega',
    items: [
      {
        q: 'Quando o comprovante de entrega fica disponível?',
        a: 'A transportadora faz o upload do comprovante (foto ou PDF) após a entrega confirmada. Você recebe notificação e pode baixar diretamente no histórico.',
      },
      {
        q: 'O comprovante não aparece. O que fazer?',
        a: 'Entre em contato com o suporte informando o número do frete. Verificaremos com a transportadora o status da entrega.',
      },
    ],
  },
  {
    icon: FileText,
    category: 'Conta e Perfil',
    items: [
      {
        q: 'Como altero minha senha?',
        a: 'Acesse "Meu Perfil" no menu superior e role até a seção "Alterar Senha". Você precisará informar a senha atual para confirmar a alteração.',
      },
      {
        q: 'Como atualizo meus dados cadastrais?',
        a: 'Acesse "Meu Perfil" no menu superior. Você pode editar nome, telefone, CPF/CNPJ e endereço a qualquer momento.',
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        className="w-full flex items-start justify-between gap-3 py-4 text-left hover:bg-slate-50/60 px-1 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-slate-800">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="text-sm text-slate-500 pb-4 px-1 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function SuportePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Central de Suporte</h1>
            <p className="text-sm text-slate-500">Tire suas dúvidas ou fale com nossa equipe</p>
          </div>
        </div>

        {/* Canais de contato */}
        <div className="grid grid-cols-1 gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá,%20preciso%20de%20ajuda%20com%20meu%20frete%20na%20RotaClick.`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">WhatsApp</p>
                  <p className="text-sm text-slate-500">Atendimento rápido — seg a sex, 8h às 18h</p>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">Online</span>
              </CardContent>
            </Card>
          </a>

          <a href={`mailto:${SUPPORT_EMAIL}?subject=Suporte%20RotaClick`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">E-mail</p>
                  <p className="text-sm text-slate-500">{SUPPORT_EMAIL}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" /> Resp. em até 24h
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Horário de atendimento */}
        <Card className="border-0 shadow-sm bg-brand-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-800">Horário de atendimento</p>
              <p className="text-xs text-brand-600">Segunda a Sexta: 8h às 18h · Sábado: 9h às 13h</p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-500" />
            <h2 className="text-base font-semibold text-slate-800">Perguntas frequentes</h2>
          </div>

          {faqs.map(({ icon: Icon, category, items }) => (
            <Card key={category} className="border-0 shadow-sm">
              <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 uppercase tracking-wide">
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-2 pt-1">
                {items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA final */}
        <Card className="border-0 shadow-sm border-brand-100">
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-slate-600">Não encontrou o que precisava?</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá,%20preciso%20de%20ajuda%20com%20meu%20frete%20na%20RotaClick.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                <MessageCircle className="h-4 w-4 mr-2" />
                Falar com suporte agora
              </Button>
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
