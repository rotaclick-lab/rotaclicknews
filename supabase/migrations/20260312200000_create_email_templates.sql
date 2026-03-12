create table if not exists public.email_templates (
  id text primary key,
  label text not null,
  subject text not null,
  html text not null,
  variables text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

create policy "Admins can do everything on email_templates"
  on public.email_templates
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

insert into public.email_templates (id, label, subject, html, variables) values
(
  'boas-vindas',
  'Boas-vindas Embarcador',
  '👋 Bem-vindo à RotaClick!',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:bold;">🚛 RotaClick</span></td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">👋 Bem-vindo à RotaClick!</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>{{name}}</strong>! Sua conta foi criada com sucesso.</p>
        <p style="color:#374151;margin:0 0 12px;font-size:15px;">Com a RotaClick você pode:</p>
        <ul style="color:#374151;font-size:14px;padding-left:20px;margin:0 0 24px;">
          <li style="margin-bottom:8px;">Cotar frete com múltiplas transportadoras em segundos</li>
          <li style="margin-bottom:8px;">Contratar e pagar com segurança via cartão</li>
          <li style="margin-bottom:8px;">Acompanhar todas as suas entregas em um só lugar</li>
        </ul>
        <a href="https://rotaclick.com.br/cliente" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">Fazer minha primeira cotação</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">RotaClick — Cotação inteligente de frete | <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  array['name']
),
(
  'frete-pago',
  'Frete Confirmado (Embarcador)',
  '✅ Frete confirmado — {{carrierName}}',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:bold;">🚛 RotaClick</span></td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">✅ Frete confirmado!</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>{{name}}</strong>! Seu frete foi contratado com sucesso.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>🚛 Transportadora:</strong> {{carrierName}}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> {{originZip}} → {{destZip}}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo estimado:</strong> {{prazo}}</p>
            <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor pago:</strong> {{price}}</p>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;margin:0;">Acompanhe o status da entrega pelo seu painel.</p>
        <a href="https://rotaclick.com.br/cliente" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">Acessar Meu Painel</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">RotaClick — Cotação inteligente de frete | <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  array['name', 'carrierName', 'originZip', 'destZip', 'prazo', 'price']
),
(
  'transp-aprovada',
  'Cadastro Aprovado (Transportadora)',
  '🎉 Cadastro aprovado na RotaClick!',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:bold;">🚛 RotaClick</span></td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🎉 Cadastro aprovado!</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>{{name}}</strong>! O cadastro da empresa <strong>{{companyName}}</strong> foi aprovado pela RotaClick.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">✅ Sua empresa já está ativa na plataforma</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📋 Acesse o painel e cadastre sua tabela de frete</p>
            <p style="margin:0;font-size:14px;color:#374151;">🚛 Em breve você começará a receber cotações!</p>
          </td></tr>
        </table>
        <a href="https://rotaclick.com.br/dashboard" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">Acessar Painel da Transportadora</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">RotaClick — Cotação inteligente de frete | <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  array['name', 'companyName']
),
(
  'transp-rejeitada',
  'Cadastro Rejeitado (Transportadora)',
  'Atualização sobre seu cadastro na RotaClick',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:bold;">🚛 RotaClick</span></td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Atualização sobre seu cadastro</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Olá, <strong>{{name}}</strong>. Infelizmente o cadastro da empresa <strong>{{companyName}}</strong> não foi aprovado neste momento.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;font-weight:bold;text-transform:uppercase;">Motivo</p>
            <p style="margin:0;font-size:14px;color:#374151;">{{reason}}</p>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Em caso de dúvidas, entre em contato com nosso suporte:</p>
        <p style="margin:0;"><a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;font-size:14px;">suporte@rotaclick.com.br</a> &nbsp;|&nbsp; (11) 3514-2933</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">RotaClick — Cotação inteligente de frete | <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  array['name', 'companyName', 'reason']
),
(
  'transp-novo-frete',
  'Novo Frete (Transportadora)',
  '🆕 Nova carga contratada — {{originZip}} → {{destZip}}',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;"><span style="color:#fff;font-size:22px;font-weight:bold;">🚛 RotaClick</span></td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🆕 Nova carga contratada!</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Olá, <strong>{{name}}</strong>! Uma nova carga foi contratada na RotaClick para sua transportadora.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>📍 Rota:</strong> {{originZip}} → {{destZip}}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⚖️ Peso taxável:</strong> {{peso}}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>⏱ Prazo:</strong> {{prazo}}</p>
            <p style="margin:0;font-size:16px;color:#ea580c;font-weight:bold;"><strong>💰 Valor:</strong> {{price}}</p>
          </td></tr>
        </table>
        <a href="https://rotaclick.com.br/dashboard" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#f97316;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:15px;">Ver no Painel</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">RotaClick — Cotação inteligente de frete | <a href="https://rotaclick.com.br" style="color:#f97316;text-decoration:none;">rotaclick.com.br</a><br/>Dúvidas? <a href="mailto:suporte@rotaclick.com.br" style="color:#f97316;text-decoration:none;">suporte@rotaclick.com.br</a></p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  array['name', 'originZip', 'destZip', 'peso', 'prazo', 'price']
)
on conflict (id) do nothing;
