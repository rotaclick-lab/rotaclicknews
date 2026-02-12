import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | RotaClick',
  description: 'Política de Privacidade da plataforma RotaClick',
}

export default function PrivacidadePage() {
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
            <CardTitle className="text-3xl font-bold text-brand-700">Política de Privacidade</CardTitle>
            <CardDescription>Última atualização: 12 de fevereiro de 2026</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Introdução</h2>
            <p>
              A RotaClick está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais.
            </p>

            <h2>2. Informações que Coletamos</h2>
            
            <h3>2.1 Informações Fornecidas por Você</h3>
            <ul>
              <li><strong>Dados Cadastrais:</strong> Nome completo, CPF, email, telefone, WhatsApp</li>
              <li><strong>Dados da Empresa:</strong> CNPJ, Razão Social, Nome Fantasia, Inscrição Estadual, RNTRC</li>
              <li><strong>Endereço:</strong> CEP, logradouro, número, complemento, bairro, cidade, UF</li>
              <li><strong>Dados Operacionais:</strong> Tipo de veículo, carroceria, capacidade de carga, regiões de atendimento, raio de atuação</li>
              <li><strong>Dados Opcionais:</strong> Consumo de diesel, número de eixos, rastreamento, seguro de carga</li>
            </ul>

            <h3>2.2 Informações Coletadas Automaticamente</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Páginas visitadas e tempo de navegação</li>
              <li>Cookies e tecnologias similares</li>
            </ul>

            <h3>2.3 Dados de Terceiros</h3>
            <ul>
              <li>Informações da Receita Federal (via BrasilAPI/ReceitaWS) para validação de CNPJ</li>
              <li>Dados de endereço via ViaCEP para preenchimento automático</li>
            </ul>

            <h2>3. Como Usamos Suas Informações</h2>
            <p>
              Utilizamos suas informações para:
            </p>
            <ul>
              <li>Criar e gerenciar sua conta na plataforma</li>
              <li>Processar e facilitar transações de frete</li>
              <li>Validar sua documentação e regularidade fiscal</li>
              <li>Enviar notificações sobre oportunidades de frete</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              <li>Análise de crédito (mediante seu consentimento)</li>
              <li>Comunicações de marketing (mediante seu consentimento)</li>
            </ul>

            <h2>4. Compartilhamento de Informações</h2>
            <p>
              Podemos compartilhar suas informações com:
            </p>
            <ul>
              <li><strong>Embarcadores:</strong> Para facilitar a contratação de serviços de frete</li>
              <li><strong>Prestadores de Serviço:</strong> Que nos auxiliam na operação da plataforma</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
              <li><strong>Parceiros de Negócio:</strong> Com seu consentimento explícito</li>
            </ul>
            <p>
              <strong>Não vendemos suas informações pessoais a terceiros.</strong>
            </p>

            <h2>5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul>
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de dados sensíveis em repouso</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Autenticação segura via Supabase Auth</li>
              <li>Monitoramento e logs de auditoria</li>
              <li>Backups regulares e recuperação de desastres</li>
            </ul>

            <h2>6. Seus Direitos (LGPD)</h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul>
              <li><strong>Acesso:</strong> Confirmar se tratamos seus dados e solicitar cópia</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar eliminação de dados desnecessários ou tratados em desconformidade</li>
              <li><strong>Portabilidade:</strong> Solicitar transferência de dados a outro fornecedor</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas situações</li>
              <li><strong>Informação:</strong> Obter informações sobre compartilhamento de dados</li>
            </ul>

            <h2>7. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pelo tempo necessário para:
            </p>
            <ul>
              <li>Cumprir os propósitos descritos nesta política</li>
              <li>Atender requisitos legais, contábeis e fiscais (geralmente 5 anos)</li>
              <li>Resolver disputas e fazer cumprir nossos acordos</li>
            </ul>

            <h2>8. Cookies</h2>
            <p>
              Utilizamos cookies para:
            </p>
            <ul>
              <li>Manter você conectado à plataforma</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o uso da plataforma</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>
            <p>
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade da plataforma.
            </p>

            <h2>9. Transferência Internacional de Dados</h2>
            <p>
              Seus dados podem ser armazenados e processados em servidores localizados fora do Brasil, incluindo Estados Unidos (Vercel, Supabase). Garantimos que tais transferências seguem as exigências da LGPD.
            </p>

            <h2>10. Menores de Idade</h2>
            <p>
              Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente informações de menores.
            </p>

            <h2>11. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por email.
            </p>

            <h2>12. Contato e DPO</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:privacidade@rotaclick.com.br" className="text-brand-600 hover:text-brand-700">privacidade@rotaclick.com.br</a></li>
              <li><strong>DPO (Encarregado de Dados):</strong> <a href="mailto:dpo@rotaclick.com.br" className="text-brand-600 hover:text-brand-700">dpo@rotaclick.com.br</a></li>
            </ul>

            <h2>13. Consentimento</h2>
            <p>
              Ao usar nossa plataforma e aceitar esta Política de Privacidade durante o cadastro, você consente com a coleta, uso e compartilhamento de suas informações conforme descrito.
            </p>

            <p className="mt-8 text-sm text-muted-foreground">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
