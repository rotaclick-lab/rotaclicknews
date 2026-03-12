import {
  emailBoasVindasEmbarcador,
  emailEmbarcadorFretePago,
  emailTransportadoraAprovada,
  emailTransportadoraRejeitada,
  emailTransportadoraNovoFrete,
  emailInternaNovaCotacao,
} from '@/lib/email'

// Extrai só o HTML dos templates sem enviar
function previewBoasVindas() {
  const name = 'João da Silva'
  return gerarHTML('Boas-vindas Embarcador', name, 'joao@exemplo.com')
}

// Como os templates são funções async que chamam send(), vou duplicar só o HTML aqui para preview

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;">
          <span style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">🚛 RotaClick</span>
        </td>
      </tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            RotaClick — Cotação inteligente de frete | 
            <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>
            Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">${label}</a>`
}

function gerarHTML(tipo: string, name: string, _email: string): string {
  switch (tipo) {
    case 'boas-vindas':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">👋 Bem-vindo à RotaClick!</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>! Sua conta foi criada com sucesso.</p>
        <p style="color:#374151;margin:0 0 12px;font-size:15px;">Com a RotaClick você pode:</p>
        <ul style="color:#374151;font-size:14px;padding-left:20px;margin:0 0 24px;">
          <li style="margin-bottom:8px;">Cotar frete com múltiplas transportadoras em segundos</li>
          <li style="margin-bottom:8px;">Contratar e pagar com segurança via cartão</li>
          <li style="margin-bottom:8px;">Acompanhar todas as suas entregas em um só lugar</li>
        </ul>
        ${btn('https://rotaclick.com.br/cliente', 'Fazer minha primeira cotação')}
      `)
    case 'frete-pago':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">✅ Frete confirmado!</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>${name}</strong>! Seu frete foi contratado com sucesso.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>🚛 Transportadora:</strong> Transportadora Exemplo Ltda</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> 01310-100 → 30130-110</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo estimado:</strong> 3 dia(s) útei(s)</p>
            <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor pago:</strong> R$ 350,00</p>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;margin:0;">Acompanhe o status da entrega pelo seu painel.</p>
        ${btn('https://rotaclick.com.br/cliente', 'Acessar Meu Painel')}
      `)
    case 'transp-aprovada':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🎉 Cadastro aprovado!</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>! O cadastro da empresa <strong>Transportadora Exemplo Ltda</strong> foi aprovado pela RotaClick.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅ Sua empresa já está ativa na plataforma</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📋 Acesse o painel e cadastre sua tabela de frete</p>
            <p style="margin:0;font-size:14px;color:#374151;">🚛 Em breve você começará a receber cotações!</p>
          </td></tr>
        </table>
        ${btn('https://rotaclick.com.br/dashboard', 'Acessar Painel da Transportadora')}
      `)
    case 'transp-rejeitada':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Atualização sobre seu cadastro</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>${name}</strong>. Infelizmente o cadastro da empresa <strong>Transportadora Exemplo Ltda</strong> não foi aprovado neste momento.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;font-weight:bold;text-transform:uppercase;">Motivo</p>
            <p style="margin:0;font-size:14px;color:#374151;">Documentação incompleta — RNTRC não encontrado na base da ANTT.</p>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Em caso de dúvidas, entre em contato com nosso suporte:</p>
        <p style="margin:0;"><a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;font-size:14px;">suporte@rotaclick.com.br</a> &nbsp;|&nbsp; (11) 3514-2933</p>
      `)
    case 'transp-novo-frete':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🆕 Nova carga contratada!</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>${name}</strong>! Uma nova carga foi contratada na RotaClick para sua transportadora.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> 01310-100 → 30130-110</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⚖️ Peso taxável:</strong> 25.0 kg</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo:</strong> 3 dia(s) útei(s)</p>
            <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor:</strong> R$ 350,00</p>
          </td></tr>
        </table>
        ${btn('https://rotaclick.com.br/dashboard', 'Ver no Painel')}
      `)
    case 'interna-cotacao':
      return base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">📋 Nova cotação solicitada</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Um embarcador solicitou cotação na plataforma.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>👤 Nome:</strong> João da Silva</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📧 E-mail:</strong> joao@exemplo.com</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📱 Telefone:</strong> (11) 99999-9999</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> 01310-100 → 30130-110</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⚖️ Peso:</strong> 25 kg</p>
            <p style="margin:0;font-size:14px;color:#374151;"><strong>💰 Valor NF:</strong> R$ 1.500,00</p>
          </td></tr>
        </table>
        ${btn('https://rotaclick.com.br/admin', 'Ver no Admin')}
      `)
    default:
      return '<p>Template não encontrado</p>'
  }
}

const TEMPLATES = [
  { id: 'boas-vindas', label: '👋 Boas-vindas Embarcador' },
  { id: 'frete-pago', label: '✅ Frete Confirmado (Embarcador)' },
  { id: 'transp-novo-frete', label: '🆕 Novo Frete (Transportadora)' },
  { id: 'transp-aprovada', label: '🎉 Cadastro Aprovado (Transportadora)' },
  { id: 'transp-rejeitada', label: '❌ Cadastro Rejeitado (Transportadora)' },
  { id: 'interna-cotacao', label: '📋 Nova Cotação (Interno)' },
]

export default function EmailPreviewPage({
  searchParams,
}: {
  searchParams: { template?: string }
}) {
  const selected = searchParams.template ?? 'boas-vindas'
  const html = gerarHTML(selected, 'João da Silva', 'joao@exemplo.com')

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#111', minHeight: '100vh' }}>
      {/* Barra de navegação dos templates */}
      <div style={{ background: '#1f2937', padding: '16px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#9ca3af', fontSize: '13px', marginRight: '8px', fontWeight: 'bold' }}>PREVIEW EMAIL:</span>
        {TEMPLATES.map((t) => (
          <a
            key={t.id}
            href={`?template=${t.id}`}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              textDecoration: 'none',
              background: selected === t.id ? '#f97316' : '#374151',
              color: selected === t.id ? '#fff' : '#d1d5db',
              fontWeight: selected === t.id ? 'bold' : 'normal',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Preview */}
      <div style={{ padding: '24px' }}>
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            border: 'none',
            borderRadius: '8px',
          }}
          title="Email Preview"
        />
      </div>
    </div>
  )
}
