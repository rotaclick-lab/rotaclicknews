# Templates de E-mail do Supabase - RotaClick

## Senha alterada (Password Changed)

Este template é enviado automaticamente quando o usuário altera a senha com sucesso. É uma notificação de segurança.

### Como configurar no Supabase

1. Acesse **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Ative **Security notifications** (se ainda não estiver ativo)
3. Localize o template **"Password changed notification"**
4. **Assunto sugerido:** `Sua senha foi alterada - RotaClick`
5. Cole o conteúdo HTML do arquivo `supabase-email-password-changed.html` no campo de conteúdo

### Variáveis disponíveis

| Variável | Descrição |
|----------|-----------|
| `{{ .Email }}` | E-mail do usuário |
| `{{ .SiteURL }}` | URL do site (ex: https://rotaclick.com.br) |
| `{{ .Data }}` | Metadados do usuário |

### Ativar notificações de segurança

As notificações de segurança (incluindo "senha alterada") só são enviadas se estiverem habilitadas:

- **Supabase Dashboard** → **Authentication** → **Email Templates**
- Procure por "Security notifications" ou "Password changed notification"
- Ative a opção **Enable** para este template

---

## E-mail alterado (Email Address Changed)

Este template é enviado automaticamente quando o usuário altera o endereço de e-mail da conta. É uma notificação de segurança.

### Como configurar no Supabase

1. Acesse **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Ative **Security notifications** (se ainda não estiver ativo)
3. Localize o template **"Email address changed notification"**
4. **Assunto sugerido:** `Seu e-mail foi alterado - RotaClick`
5. Cole o conteúdo HTML do arquivo `supabase-email-email-changed.html` no campo de conteúdo

### Variáveis disponíveis

| Variável | Descrição |
|----------|-----------|
| `{{ .OldEmail }}` | E-mail antigo do usuário |
| `{{ .Email }}` | Novo e-mail do usuário |
| `{{ .SiteURL }}` | URL do site (ex: https://rotaclick.com.br) |
