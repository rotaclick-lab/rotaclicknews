# 🎨 Componentes Shadcn/ui - RotaClick

## 📦 Componentes Instalados

Total: **26 componentes** instalados

### ✅ Formulários (7)
- **button** - Botões com variantes (default, destructive, outline, ghost, link)
- **input** - Campo de entrada de texto
- **label** - Rótulos para campos de formulário
- **form** - Sistema de formulários com React Hook Form + Zod
- **select** - Dropdown de seleção
- **textarea** - Campo de texto multi-linha
- **checkbox** - Caixa de seleção

### ✅ Layout (4)
- **card** - Cards com header, content, footer
- **separator** - Linha separadora horizontal/vertical
- **sheet** - Painel lateral (sidebar)
- **dialog** - Modal/Dialog

### ✅ Navegação (2)
- **dropdown-menu** - Menu dropdown com itens
- **navigation-menu** - Menu de navegação principal

### ✅ Feedback (4)
- **toast** - Notificações temporárias (+ hook useToast)
- **alert** - Alertas de informação/erro/sucesso
- **skeleton** - Loading skeleton
- **badge** - Badges/tags coloridos

### ✅ Dados (3)
- **table** - Tabelas responsivas
- **tabs** - Sistema de abas
- **avatar** - Avatares de usuário

### ✅ Utilidade (3)
- **popover** - Popover com posicionamento
- **calendar** - Seletor de datas
- **command** - Command palette (Cmd+K)

### 📁 Hooks Criados (1)
- **use-toast** - Hook para gerenciar toasts

## 🎯 Como Usar

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button>Clique aqui</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline" size="sm">Pequeno</Button>
```

### Form com Zod
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: z.infer<typeof schema>) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Entrar</Button>
      </form>
    </Form>
  )
}
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo aqui
  </CardContent>
  <CardFooter>
    Rodapé opcional
  </CardFooter>
</Card>
```

### Dialog
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
    </DialogHeader>
    Conteúdo do modal aqui
  </DialogContent>
</Dialog>
```

### Sheet (Sidebar)
```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

<Sheet>
  <SheetTrigger asChild>
    <Button>Abrir Sidebar</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
    </SheetHeader>
    Menu items aqui
  </SheetContent>
</Sheet>
```

### Toast
```tsx
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export function Component() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: 'Sucesso!',
          description: 'Operação realizada com sucesso',
        })
      }}
    >
      Mostrar Toast
    </Button>
  )
}
```

### Table
```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>João Silva</TableCell>
      <TableCell>joao@email.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
```

### Dropdown Menu
```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Abrir Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuItem>Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Calendar
```tsx
import { Calendar } from '@/components/ui/calendar'
import { useState } from 'react'

export function DatePicker() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
    />
  )
}
```

### Alert
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

<Alert>
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Esta é uma mensagem importante.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>
    Ocorreu um erro na operação.
  </AlertDescription>
</Alert>
```

### Tabs
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Aba 1</TabsTrigger>
    <TabsTrigger value="tab2">Aba 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Conteúdo da aba 1
  </TabsContent>
  <TabsContent value="tab2">
    Conteúdo da aba 2
  </TabsContent>
</Tabs>
```

### Avatar
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="João Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>
```

### Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Select
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

## 🎨 Variantes de Button

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

## 🎨 Variantes de Badge

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

## 📦 Arquivos Criados

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── form.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── checkbox.tsx
│       ├── card.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── navigation-menu.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── alert.tsx
│       ├── skeleton.tsx
│       ├── badge.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── avatar.tsx
│       ├── popover.tsx
│       ├── calendar.tsx
│       └── command.tsx
└── hooks/
    └── use-toast.ts
```

## ✅ Toaster Adicionado ao Layout

O componente `<Toaster />` foi adicionado ao `src/app/layout.tsx` para que os toasts funcionem em toda a aplicação.

## 🚀 Próximos Passos

Com todos os componentes instalados, podemos:

1. **Criar componentes customizados** baseados nos componentes UI
2. **Implementar páginas de autenticação** (login, registro)
3. **Criar layout do dashboard** com sidebar
4. **Implementar formulários** de fretes, motoristas, veículos
5. **Criar tabelas de dados** com paginação e filtros

## 📚 Referências

- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
