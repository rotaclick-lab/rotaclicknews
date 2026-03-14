-- Atualiza todos os templates de e-mail para o novo layout profissional
-- Cores RotaClick: primary #13b9a5, secondary #F5921B
-- {{logoHtml}} é injetado dinamicamente pelo email.ts em tempo de envio

-- ─── boas-vindas ─────────────────────────────────────────────────────────────
UPDATE public.email_templates SET
  subject = '👋 Bem-vindo à RotaClick!',
  html    = '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>RotaClick</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Segoe UI'',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#13b9a5 0%,#13b9a5cc 100%);padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:28px 36px 24px;">{{logoHtml}}</td>
        <td style="padding:28px 36px 24px;text-align:right;"><span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span></td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
        <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
        <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
      </tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.6;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Bem-vindo à RotaClick! 👋</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Olá, <strong>{{name}}</strong>! Sua conta foi criada com sucesso. Veja o que você pode fazer:</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid #13b9a5;"><p style="margin:0;font-size:14px;color:#334155;">⚡ <strong>Cotar frete</strong> com múltiplas transportadoras em segundos</p></td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid #13b9a5;"><p style="margin:0;font-size:14px;color:#334155;">🔒 <strong>Contratar e pagar</strong> com segurança via cartão</p></td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border-left:4px solid #13b9a5;"><p style="margin:0;font-size:14px;color:#334155;">📦 <strong>Acompanhar</strong> todas as suas entregas em um só lugar</p></td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;"><tr><td style="border-radius:8px;background:#13b9a5;">
      <a href="https://rotaclick.com.br/cliente" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Fazer minha primeira cotação</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
  <tr><td style="padding:24px 36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td><p style="margin:0 0 6px;font-size:13px;color:#64748b;"><strong style="color:#334155;">RotaClick</strong> — Cotação inteligente de frete</p>
        <p style="margin:0;font-size:12px;color:#64748b;"><a href="https://rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">rotaclick.com.br</a> &nbsp;·&nbsp; <a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;">(11) 3514-2933</a></p></td>
        <td style="text-align:right;vertical-align:bottom;"><span style="font-size:22px;">🚛</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;"><p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma RotaClick.<br/>Este é um e-mail automático, por favor não responda diretamente.</p></td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  updated_at = now()
WHERE id = 'boas-vindas';

-- ─── frete-pago ───────────────────────────────────────────────────────────────
UPDATE public.email_templates SET
  subject = '✅ Frete confirmado — {{carrierName}}',
  html    = '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>RotaClick</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Segoe UI'',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#13b9a5 0%,#13b9a5cc 100%);padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:28px 36px 24px;">{{logoHtml}}</td>
        <td style="padding:28px 36px 24px;text-align:right;"><span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span></td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
        <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
        <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
      </tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.6;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Frete confirmado! ✅</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Olá, <strong>{{name}}</strong>! Seu frete foi contratado com sucesso.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">🚛 <strong>Transportadora:</strong> {{carrierName}}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">📍 <strong>Rota:</strong> {{originZip}} → {{destZip}}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">⏱ <strong>Prazo estimado:</strong> {{prazo}}</p>
        <p style="margin:0;font-size:14px;color:#334155;">💰 <strong>Valor pago:</strong> <span style="color:#13b9a5;font-size:16px;font-weight:700;">{{price}}</span></p>
      </td></tr>
    </table>
    <p style="margin:0;color:#64748b;font-size:14px;">Acompanhe o status da entrega pelo seu painel.</p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;"><tr><td style="border-radius:8px;background:#13b9a5;">
      <a href="https://rotaclick.com.br/cliente" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Acessar Meu Painel</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
  <tr><td style="padding:24px 36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td><p style="margin:0 0 6px;font-size:13px;color:#64748b;"><strong style="color:#334155;">RotaClick</strong> — Cotação inteligente de frete</p>
        <p style="margin:0;font-size:12px;color:#64748b;"><a href="https://rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">rotaclick.com.br</a> &nbsp;·&nbsp; <a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;">(11) 3514-2933</a></p></td>
        <td style="text-align:right;vertical-align:bottom;"><span style="font-size:22px;">🚛</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;"><p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma RotaClick.<br/>Este é um e-mail automático, por favor não responda diretamente.</p></td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  updated_at = now()
WHERE id = 'frete-pago';

-- ─── transp-aprovada ──────────────────────────────────────────────────────────
UPDATE public.email_templates SET
  subject = '🎉 Cadastro aprovado na RotaClick!',
  html    = '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>RotaClick</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Segoe UI'',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#13b9a5 0%,#13b9a5cc 100%);padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:28px 36px 24px;">{{logoHtml}}</td>
        <td style="padding:28px 36px 24pd;text-align:right;"><span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span></td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
        <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
        <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
      </tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.6;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Cadastro aprovado! 🎉</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Parabéns, <strong>{{name}}</strong>! O cadastro da <strong>{{companyName}}</strong> foi aprovado na plataforma.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:14px 18px;"><p style="margin:0;font-size:14px;color:#166534;">✅&nbsp;&nbsp;Sua empresa já está ativa e visível para embarcadores em toda a plataforma.</p></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">✅ Acesse o painel e verifique sua tabela de frete</p>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">📋 Configure seus dados e documentos</p>
        <p style="margin:0;font-size:14px;color:#334155;">🚛 Em breve você começará a receber cotações!</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;"><tr><td style="border-radius:8px;background:#13b9a5;">
      <a href="https://rotaclick.com.br/dashboard" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Acessar Painel da Transportadora</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
  <tr><td style="padding:24px 36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td><p style="margin:0 0 6px;font-size:13px;color:#64748b;"><strong style="color:#334155;">RotaClick</strong> — Cotação inteligente de frete</p>
        <p style="margin:0;font-size:12px;color:#64748b;"><a href="https://rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">rotaclick.com.br</a> &nbsp;·&nbsp; <a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;">(11) 3514-2933</a></p></td>
        <td style="text-align:right;vertical-align:bottom;"><span style="font-size:22px;">🚛</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;"><p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma RotaClick.<br/>Este é um e-mail automático, por favor não responda diretamente.</p></td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  updated_at = now()
WHERE id = 'transp-aprovada';

-- ─── transp-rejeitada ─────────────────────────────────────────────────────────
UPDATE public.email_templates SET
  subject = 'Atualização sobre seu cadastro na RotaClick',
  html    = '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>RotaClick</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Segoe UI'',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#13b9a5 0%,#13b9a5cc 100%);padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:28px 36px 24px;">{{logoHtml}}</td>
        <td style="padding:28px 36px 24px;text-align:right;"><span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span></td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
        <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
        <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
      </tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.6;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Atualização sobre seu cadastro</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Olá, <strong>{{name}}</strong>. Analisamos o cadastro da <strong>{{companyName}}</strong> e precisamos informar:</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:14px 18px;"><p style="margin:0;font-size:14px;color:#991b1b;">❌&nbsp;&nbsp;Seu cadastro não foi aprovado neste momento. Veja o motivo abaixo.</p></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:16px 0 24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Motivo da reprovação</p>
        <p style="margin:0;font-size:14px;color:#334155;">{{reason}}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Precisa de ajuda ou deseja contestar? Entre em contato:</p>
    <p style="margin:0;font-size:14px;"><a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;font-weight:600;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;font-weight:600;">(11) 3514-2933</a></p>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
  <tr><td style="padding:24px 36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td><p style="margin:0 0 6px;font-size:13px;color:#64748b;"><strong style="color:#334155;">RotaClick</strong> — Cotação inteligente de frete</p>
        <p style="margin:0;font-size:12px;color:#64748b;"><a href="https://rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">rotaclick.com.br</a> &nbsp;·&nbsp; <a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;">(11) 3514-2933</a></p></td>
        <td style="text-align:right;vertical-align:bottom;"><span style="font-size:22px;">🚛</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;"><p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma RotaClick.<br/>Este é um e-mail automático, por favor não responda diretamente.</p></td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  updated_at = now()
WHERE id = 'transp-rejeitada';

-- ─── transp-novo-frete ────────────────────────────────────────────────────────
UPDATE public.email_templates SET
  subject = '🆕 Nova carga contratada — {{originZip}} → {{destZip}}',
  html    = '<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/><title>RotaClick</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:''Segoe UI'',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#F5921B 0%,#F5921Bcc 100%);padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:28px 36px 24px;">{{logoHtml}}</td>
        <td style="padding:28px 36px 24px;text-align:right;"><span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Plataforma de Frete</span></td>
      </tr>
      <tr><td colspan="2" style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="height:4px;background:rgba(255,255,255,0.25);"></td>
        <td style="height:4px;background:rgba(255,255,255,0.5);width:30%;"></td>
        <td style="height:4px;background:rgba(255,255,255,0.8);width:15%;"></td>
      </tr></table></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.6;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0f172a;">Nova carga contratada! 🆕</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Olá, <strong>{{name}}</strong>! Uma nova carga foi contratada com sua empresa.</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">📍 <strong>Rota:</strong> CEP {{originZip}} → CEP {{destZip}}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">⚖️ <strong>Peso taxável:</strong> {{peso}}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#334155;">⏱ <strong>Prazo acordado:</strong> {{prazo}}</p>
        <p style="margin:0;font-size:14px;color:#334155;">💰 <strong>Valor:</strong> <span style="color:#F5921B;font-size:16px;font-weight:700;">{{price}}</span></p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin:20px 0;">
      <tr><td style="padding:14px 18px;"><p style="margin:0;font-size:14px;color:#1e40af;">ℹ️&nbsp;&nbsp;Acesse o painel para ver os detalhes completos e iniciar o atendimento.</p></td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;"><tr><td style="border-radius:8px;background:#F5921B;">
      <a href="https://rotaclick.com.br/dashboard" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">Ver Carga no Painel</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
  <tr><td style="padding:24px 36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td><p style="margin:0 0 6px;font-size:13px;color:#64748b;"><strong style="color:#334155;">RotaClick</strong> — Cotação inteligente de frete</p>
        <p style="margin:0;font-size:12px;color:#64748b;"><a href="https://rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">rotaclick.com.br</a> &nbsp;·&nbsp; <a href="mailto:suporte@rotaclick.com.br" style="color:#13b9a5;text-decoration:none;">suporte@rotaclick.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/551135142933" style="color:#13b9a5;text-decoration:none;">(11) 3514-2933</a></p></td>
        <td style="text-align:right;vertical-align:bottom;"><span style="font-size:22px;">🚛</span></td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;"><p style="margin:0;font-size:11px;color:#94a3b8;">Você recebeu este e-mail por ser cadastrado na plataforma RotaClick.<br/>Este é um e-mail automático, por favor não responda diretamente.</p></td></tr>
    </table>
  </td></tr>
</table>
</td></tr></table>
</body></html>',
  updated_at = now()
WHERE id = 'transp-novo-frete';
