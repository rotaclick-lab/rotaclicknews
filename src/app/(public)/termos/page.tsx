import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso | RotaClick',
  description: 'Termos de Uso da plataforma RotaClick',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-brand-700">Termos de Uso</CardTitle>
            <CardDescription>Última atualização: 12 de fevereiro de 2026</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma RotaClick, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              O RotaClick é uma plataforma digital que conecta transportadoras a oportunidades de frete, facilitando a gestão de rotas, cotações e operações logísticas.
            </p>

            <h2>3. Cadastro e Conta</h2>
            <p>
              Para utilizar nossos serviços, você deve:
            </p>
            <ul>
              <li>Fornecer informações verdadeiras, precisas e completas durante o processo de cadastro</li>
              <li>Manter a segurança de sua senha e conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Ser uma transportadora devidamente regularizada com CNPJ, Inscrição Estadual e RNTRC válidos</li>
            </ul>

            <h2>4. Uso da Plataforma</h2>
            <p>
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. É proibido:
            </p>
            <ul>
              <li>Usar a plataforma de qualquer maneira que viole leis ou regulamentos aplicáveis</li>
              <li>Transmitir qualquer material que seja difamatório, obsceno ou ilegal</li>
              <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
              <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
            </ul>

            <h2>5. Dados e Privacidade</h2>
            <p>
              Coletamos e processamos seus dados pessoais conforme descrito em nossa <Link href="/privacidade" className="text-brand-600 hover:text-brand-700">Política de Privacidade</Link>.
            </p>

            <h2>6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones e software, é propriedade do RotaClick e protegido por leis de direitos autorais.
            </p>

            <h2>7. Responsabilidades</h2>
            <p>
              A transportadora é responsável por:
            </p>
            <ul>
              <li>Manter documentação e licenças em dia</li>
              <li>Cumprir prazos e condições acordadas</li>
              <li>Garantir a segurança e integridade das cargas</li>
              <li>Fornecer informações precisas sobre sua frota e capacidade operacional</li>
            </ul>

            <h2>8. Limitação de Responsabilidade</h2>
            <p>
              O RotaClick não se responsabiliza por:
            </p>
            <ul>
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Perda de lucros ou dados</li>
              <li>Interrupções temporárias do serviço</li>
              <li>Ações de terceiros usuários da plataforma</li>
            </ul>

            <h2>9. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
            </p>

            <h2>10. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta se você violar estes Termos de Uso, sem aviso prévio.
            </p>

            <h2>11. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
            </p>

            <h2>12. Contato</h2>
            <p>
              Para questões sobre estes Termos de Uso, entre em contato conosco através do email: <a href="mailto:contato@rotaclick.com.br" className="text-brand-600 hover:text-brand-700">contato@rotaclick.com.br</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
