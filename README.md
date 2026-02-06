# 🚛 RotaClick - Sistema de Gestão de Fretes

![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.1-cyan)

Sistema completo de gestão de fretes desenvolvido para pequenas e médias transportadoras brasileiras.

## 🌐 Deploy em Produção

**URL:** https://rotaclick.com.br

---

## 🚀 Deploy Rápido

### 1. Clonar Repositório
```bash
git clone https://github.com/rotaclick-lab/rotaclicknews.git
cd rotaclicknews
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.production.example .env.local
# Editar .env.local com suas credenciais
```

### 3. Rodar Localmente
```bash
npm run dev
# Abrir http://localhost:3000
```

### 4. Deploy para Produção
```bash
# Push para GitHub (deploy automático na Vercel)
git push origin main
```

📖 **Guia Completo:** Ver [DEPLOY.md](./DEPLOY.md)  
✅ **Checklist:** Ver [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md)

---

## 📦 Funcionalidades

### ✅ Implementado (v1.0)

- 🔐 **Autenticação Completa**
  - Login/Registro
  - Recuperação de senha
  - Confirmação por email
  - Proteção de rotas

- 📊 **Dashboard**
  - Stats em tempo real (Supabase)
  - Navegação responsiva
  - Sidebar colapsável
  - Mobile-first design

- 🎨 **UI/UX**
  - 26+ componentes Shadcn/ui
  - Dark mode ready
  - Design system consistente
  - Totalmente responsivo

- 🗄️ **Database**
  - 10 tabelas com RLS
  - 8 ENUMs customizados
  - Triggers automáticos
  - Políticas de segurança

### 🚧 Em Desenvolvimento (v1.1)

- 📦 CRUD de Fretes
- 👥 Gestão de Clientes
- 🚛 Gestão de Motoristas
- 🚗 Controle de Veículos
- 🗺️ Integração Google Maps
- 💰 Módulo Financeiro
- 📈 Relatórios e Analytics

---

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component Library
- **Lucide Icons** - Icon System

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL 15+** - Database
- **Row Level Security** - Data Security
- **Supabase Auth** - Authentication

### DevOps
- **Vercel** - Hosting & CI/CD
- **GitHub** - Version Control

---

## 📁 Estrutura do Projeto

```
rotaclicknews/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (dashboard)/       # Rotas protegidas
│   │   └── auth/              # Callbacks OAuth
│   ├── components/            # React Components
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
├── supabase/migrations/       # Database migrations
├── DEPLOY.md                  # Guia de deploy
├── DEPLOY-CHECKLIST.md        # Checklist
└── README.md                  # Este arquivo
```

---

## 🔐 Segurança

- ✅ Row Level Security (RLS)
- ✅ HTTPS obrigatório
- ✅ Validação Zod
- ✅ Environment variables protegidas
- ⚠️ **NUNCA** commitar `.env` com credenciais

---

## 📄 Licença

Proprietary - © 2024 RotaClick

---

## 📞 Suporte

**Email:** contato@rotaclick.com.br  
**Website:** https://rotaclick.com.br

---

**Desenvolvido com ❤️ para transportadoras brasileiras** 🇧🇷
