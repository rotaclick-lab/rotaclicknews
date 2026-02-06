# 📊 Guia Visual do Dashboard - RotaClick

## 🖥️ Layout Completo

```
┌────────────────────────────────────────────────────────────────┐
│                        DESKTOP VIEW                            │
├──────────┬─────────────────────────────────────────────────────┤
│          │  Header (64px)                                      │
│          │  [☰ Menu] [🔍 Buscar...] [🔔][👤 Avatar ▼]        │
│ Sidebar  ├─────────────────────────────────────────────────────┤
│ (256px)  │  Main Content (bg-gray-50)                          │
│          │  ┌────────────────────────────────────────────┐     │
│ [Logo]   │  │  Dashboard                                 │     │
│ RotaClick│  │  Visão geral da sua transportadora         │     │
│          │  ├────────┬────────┬────────┬────────┐        │     │
│ Nav:     │  │ 🚛 12  │ 💰 R$  │ 📦 48  │ 👥 15  │        │     │
│ ■ Dash   │  │ Ativos │ 15.2k  │ Entreg │ Client │        │     │
│ □ Fretes │  │ +12%   │ +8%    │ +15%   │ +3%    │        │     │
│ □ Market │  ├────────┴────────┴────────┴────────┘        │     │
│ □ Financ │  │                                             │     │
│ □ Veícul │  │  Quick Actions                              │     │
│ □ Motors │  │  [📦 Novo Frete] [🚛 Veículo] [👤 Cliente]│     │
│ □ Client │  │                                             │     │
│ □ Config │  │  Atividade Recente                          │     │
│          │  │  [Nenhuma atividade]                        │     │
│ Help Box │  └────────────────────────────────────────────┘     │
└──────────┴─────────────────────────────────────────────────────┘
```

## 📱 Mobile View

```
┌─────────────────────┐
│  Header             │
│  [☰][🔍][🔔][👤]  │
├─────────────────────┤
│  Main Content       │
│  ┌────────┬────────┐│
│  │ 🚛 12  │ 💰 R$  ││
│  │ Ativos │ 15.2k  ││
│  │ +12%   │ +8%    ││
│  ├────────┼────────┤│
│  │ 📦 48  │ 👥 15  ││
│  │ Entreg │ Client ││
│  │ +15%   │ +3%    ││
│  └────────┴────────┘│
│                     │
│  Quick Actions      │
│  [📦 Novo Frete]   │
│  [🚛 Novo Veículo] │
│  [👤 Novo Cliente] │
└─────────────────────┘
```

## 🎨 Componentes Detalhados

### 1. Sidebar (Desktop)

```
┌────────────────────┐
│  [R] RotaClick     │ ← Logo + Nome
│  Gestão de Fretes  │
├────────────────────┤
│                    │
│  ■ Dashboard       │ ← Active (azul)
│  □ Fretes      [>] │ ← Com submenu
│  □ Marketplace     │
│  □ Financeiro  [>] │ ← Com submenu
│  □ Veículos        │
│  □ Motoristas      │
│  □ Clientes        │
│  □ Configurações   │
│                    │
├────────────────────┤
│  Precisa de ajuda? │ ← Help Box
│  Central de suporte│
│  [Ver tutoriais]   │
└────────────────────┘
```

### 2. Submenu Expandido

```
□ Fretes      [v]
  → Todos os Fretes
  → Novo Frete
  → Em Trânsito
```

### 3. Header

```
┌──────────────────────────────────────────┐
│ [☰] [🔍 Buscar fretes...]  [🔔] [Avatar]│
│                              ●           │
│                           (badge)        │
└──────────────────────────────────────────┘
```

### 4. User Dropdown

```
Clicando no Avatar:
┌─────────────────────────┐
│ João Silva              │
│ joao@email.com          │
│ 👑 Proprietário         │
├─────────────────────────┤
│ 👤 Meu Perfil           │
│ 🏢 Minha Empresa        │
│ ⚙️ Configurações        │
├─────────────────────────┤
│ 🚪 Sair (vermelho)      │
└─────────────────────────┘
```

### 5. Stat Card

```
┌────────────────────┐
│ Fretes Ativos  🚛  │ ← Título + Ícone
├────────────────────┤
│ 12                 │ ← Valor grande
│ Em trânsito...     │ ← Descrição
│ ↗ +12% vs mês...   │ ← Trend (verde)
└────────────────────┘
```

### 6. Quick Action Card

```
┌────────────────────┐
│ 📦 Novo Frete      │ ← Título
├────────────────────┤
│ Cadastre um novo   │ ← Descrição
│ frete rapidamente  │
└────────────────────┘
(hover: bg-gray-50)
```

## 🎯 Estados de UI

### Active Link
```
■ Dashboard   ← bg-primary/10, text-primary, font-medium
```

### Hover Link
```
□ Fretes      ← hover:bg-gray-100
```

### Expanded Submenu
```
□ Fretes   [v]  ← ChevronRight rotated 90deg
  → Item 1
  → Item 2
```

### Notification Badge
```
[🔔]
  ● ← bg-red-500, h-2 w-2, top-1 right-1
```

## 🎨 Paleta de Cores

### Light Mode
```
Background:     white / gray-50
Text:           gray-900
Border:         gray-200
Primary:        blue-600
Hover:          gray-100
Active:         primary/10
```

### Dark Mode
```
Background:     gray-800 / gray-900
Text:           gray-50
Border:         gray-700
Primary:        blue-500
Hover:          gray-700
Active:         primary/10
```

## 📐 Dimensões

### Layout
```
Sidebar Width:    256px (w-64)
Header Height:    64px (h-16)
Avatar Size:      40px (h-10 w-10)
Icon Size:        20px (h-5 w-5)
```

### Espaçamento
```
Container Padding:  16px (p-4) mobile
                    24px (p-6) desktop
Gap between cards:  16px (gap-4)
Card Padding:       12-16px
```

### Typography
```
Page Title:       30px (text-3xl)
Card Title:       14px (text-sm)
Card Value:       24px (text-2xl)
Body Text:        14px
Small Text:       12px (text-xs)
```

## 🔄 Interações

### 1. Menu Mobile
```
[☰] Click
  ↓
Sheet opens from left
  ↓
Navegação completa
  ↓
Click em link → fecha automático
```

### 2. Submenu
```
Click em "Fretes"
  ↓
Chevron rota 90deg
  ↓
Items aparecem abaixo
  ↓
Click novamente → fecha
```

### 3. User Menu
```
Click em Avatar
  ↓
Dropdown abre
  ↓
Click em "Sair"
  ↓
Logout → redirect /login
```

### 4. Busca
```
Focus no input
  ↓
Border azul
  ↓
Digitar
  ↓
(Futuro: autocomplete)
```

## 📱 Breakpoints

### Mobile (< 768px)
- Sidebar escondida
- Hamburger menu visível
- Stats em grid 2x2
- Quick actions empilhados

### Tablet (768px - 1024px)
- Sidebar visível
- Header com busca
- Stats em grid 2x2
- Quick actions em grid 3x1

### Desktop (> 1024px)
- Layout completo
- Stats em grid 4x1
- Quick actions em grid 3x1
- Max width para legibilidade

## 🎬 Animações

### Transitions
```css
.nav-link {
  transition: background-color 200ms ease;
}

.chevron {
  transition: transform 300ms ease;
}

.sheet {
  transition: transform 300ms ease;
}
```

### Hover Effects
```
Card: hover:bg-gray-50
Button: hover:bg-gray-100
Link: hover:underline
```

## ✅ Acessibilidade

### Keyboard Navigation
- ✅ Tab entre elementos
- ✅ Enter para ativar
- ✅ Escape para fechar modals

### Screen Readers
- ✅ Labels em todos inputs
- ✅ Alt text em imagens
- ✅ ARIA labels em ícones

### Contraste
- ✅ WCAG AA compliant
- ✅ Text readable em backgrounds
- ✅ Focus visible

## 🚀 Performance

### Loading States
```
Stats: Skeleton placeholders
Lists: Loading spinners
Images: Lazy loading
```

### Optimization
- ✅ CSS-in-JS otimizado (Tailwind)
- ✅ Ícones tree-shakeable (Lucide)
- ✅ Componentes code-split
- ✅ Imagens otimizadas (Next/Image)

## 🎉 Resultado Final

Um dashboard **moderno**, **responsivo** e **profissional** com:

- ✅ Navegação intuitiva
- ✅ Visual clean
- ✅ Performance otimizada
- ✅ Acessível
- ✅ Type-safe
- ✅ Pronto para produção

**Acesse:** http://localhost:3001/dashboard 🚀
