'use client'

import { useState, useRef } from 'react'
import { 
  Camera, Save, Building2, User, Phone, MapPin, Mail, Shield, 
  Pencil, CheckCircle2, Loader2, Eye, EyeOff, Bell, Palette, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BRAZILIAN_STATES } from '@/lib/constants'

export default function PerfilPage() {
  const [activeSection, setActiveSection] = useState<'perfil' | 'empresa' | 'configuracoes'>('perfil')
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Dados do perfil
  const [perfil, setPerfil] = useState({
    nomeCompleto: 'João da Silva',
    cpf: '123.456.789-00',
    cargo: 'Proprietário / Sócio',
    email: 'joao@transportadora.com',
    telefone: '(11) 3456-7890',
    celular: '(11) 98765-4321',
  })

  // Dados da empresa
  const [empresa, setEmpresa] = useState({
    razaoSocial: 'Transportadora Silva Ltda',
    nomeFantasia: 'Silva Transportes',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123456789',
    cep: '04571-010',
    logradouro: 'Rua das Flores',
    numero: '123',
    complemento: 'Sala 5',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
  })

  // Configurações
  const [config, setConfig] = useState({
    notificacaoEmail: true,
    notificacaoSMS: false,
    notificacaoCotacao: true,
    notificacaoContratacao: true,
    temaEscuro: false,
  })

  // Senha
  const [senha, setSenha] = useState({
    atual: '',
    nova: '',
    confirmar: '',
  })

  // Máscaras
  const maskPhone = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCelular = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCEP = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato inválido. Use JPG, PNG ou WebP')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        toast.success('Foto atualizada! Clique em Salvar para confirmar.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    toast.success('Dados salvos com sucesso!')
  }

  const handleChangePassword = async () => {
    if (!senha.atual || !senha.nova || !senha.confirmar) {
      toast.error('Preencha todos os campos de senha')
      return
    }
    if (senha.nova !== senha.confirmar) {
      toast.error('As senhas não coincidem')
      return
    }
    if (senha.nova.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres')
      return
    }
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    setSenha({ atual: '', nova: '', confirmar: '' })
    toast.success('Senha alterada com sucesso!')
  }

  const handleCEPChange = async (value: string) => {
    const masked = maskCEP(value)
    setEmpresa(prev => ({ ...prev, cep: masked }))
    const clean = value.replace(/\D/g, '')
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setEmpresa(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }))
        }
      } catch {}
    }
  }

  const sections = [
    { id: 'perfil' as const, label: 'Meu Perfil', icon: User },
    { id: 'empresa' as const, label: 'Empresa', icon: Building2 },
    { id: 'configuracoes' as const, label: 'Configurações', icon: Shield },
  ]

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header do Perfil */}
        <div className="relative mb-8">
          {/* Banner */}
          <div className="h-40 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-400 to-orange-400 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtNGgydjRoNHYyaC00djRoLTJ2LTR6bTAtMzBoLTJ2LTRoMnYtNGgydjRoNHYyaC00djRoLTJ2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-8 flex items-end gap-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-brand-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-brand-800">{perfil.nomeCompleto}</h2>
              <p className="text-sm text-muted-foreground">{empresa.nomeFantasia}</p>
            </div>
          </div>
        </div>

        {/* Espaço para o avatar */}
        <div className="h-8" />

        {/* Tabs de Seção */}
        <div className="flex gap-2 mb-6 border-b border-brand-100 pb-1">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2',
                  activeSection === section.id
                    ? 'text-brand-700 border-brand-500 bg-brand-50'
                    : 'text-muted-foreground border-transparent hover:text-brand-600 hover:bg-brand-50/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Seção: Meu Perfil */}
        {activeSection === 'perfil' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <User className="h-5 w-5 text-brand-500" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Dados do responsável pela transportadora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={perfil.nomeCompleto}
                      onChange={(e) => setPerfil({ ...perfil, nomeCompleto: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={perfil.cpf} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={perfil.cargo}
                      onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone Fixo</Label>
                    <Input
                      value={perfil.telefone}
                      onChange={(e) => setPerfil({ ...perfil, telefone: maskPhone(e.target.value) })}
                      className="focus-visible:ring-brand-500"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Celular / WhatsApp</Label>
                    <Input
                      value={perfil.celular}
                      onChange={(e) => setPerfil({ ...perfil, celular: maskCelular(e.target.value) })}
                      className="focus-visible:ring-brand-500"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Lock className="h-5 w-5 text-orange-500" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={senha.atual}
                        onChange={(e) => setSenha({ ...senha, atual: e.target.value })}
                        className="pr-10 focus-visible:ring-brand-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={senha.nova}
                        onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
                        className="pr-10 focus-visible:ring-brand-500"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={senha.confirmar}
                      onChange={(e) => setSenha({ ...senha, confirmar: e.target.value })}
                      className={cn(
                        'focus-visible:ring-brand-500',
                        senha.confirmar && senha.nova !== senha.confirmar && 'border-red-300'
                      )}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 font-bold"
                    onClick={handleChangePassword}
                    disabled={saving}
                  >
                    <Lock className="h-4 w-4 mr-2" /> Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção: Empresa */}
        {activeSection === 'empresa' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Building2 className="h-5 w-5 text-brand-500" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>Informações cadastrais da transportadora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Razão Social</Label>
                    <Input value={empresa.razaoSocial} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={empresa.nomeFantasia}
                      onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={empresa.cnpj} disabled className="bg-gray-50 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Estadual</Label>
                    <Input
                      value={empresa.inscricaoEstadual}
                      onChange={(e) => setEmpresa({ ...empresa, inscricaoEstadual: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={empresa.cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      className="focus-visible:ring-brand-500"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={empresa.logradouro}
                      onChange={(e) => setEmpresa({ ...empresa, logradouro: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={empresa.numero}
                      onChange={(e) => setEmpresa({ ...empresa, numero: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input
                      value={empresa.complemento}
                      onChange={(e) => setEmpresa({ ...empresa, complemento: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      value={empresa.bairro}
                      onChange={(e) => setEmpresa({ ...empresa, bairro: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={empresa.cidade}
                      onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <select
                      value={empresa.estado}
                      onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Selecione...</option>
                      {BRAZILIAN_STATES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seção: Configurações */}
        {activeSection === 'configuracoes' && (
          <div className="space-y-6 animate-in fade-in duration-300" id="configuracoes">
            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Bell className="h-5 w-5 text-brand-500" />
                  Notificações
                </CardTitle>
                <CardDescription>Controle como você recebe alertas e avisos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">Receber alertas no seu email cadastrado</p>
                  </div>
                  <Switch
                    checked={config.notificacaoEmail}
                    onCheckedChange={(checked) => setConfig({ ...config, notificacaoEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium">Notificações por SMS</p>
                    <p className="text-sm text-muted-foreground">Receber alertas via SMS no celular</p>
                  </div>
                  <Switch
                    checked={config.notificacaoSMS}
                    onCheckedChange={(checked) => setConfig({ ...config, notificacaoSMS: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium">Alerta de Nova Cotação</p>
                    <p className="text-sm text-muted-foreground">Ser notificado quando aparecer em uma cotação</p>
                  </div>
                  <Switch
                    checked={config.notificacaoCotacao}
                    onCheckedChange={(checked) => setConfig({ ...config, notificacaoCotacao: checked })}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Alerta de Contratação</p>
                    <p className="text-sm text-muted-foreground">Ser notificado quando um frete for contratado</p>
                  </div>
                  <Switch
                    checked={config.notificacaoContratacao}
                    onCheckedChange={(checked) => setConfig({ ...config, notificacaoContratacao: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-brand-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Palette className="h-5 w-5 text-orange-500" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Tema Escuro</p>
                    <p className="text-sm text-muted-foreground">Ativar modo escuro na interface</p>
                  </div>
                  <Switch
                    checked={config.temaEscuro}
                    onCheckedChange={(checked) => setConfig({ ...config, temaEscuro: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Shield className="h-5 w-5 text-red-500" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Desativar Conta</p>
                    <p className="text-sm text-red-600">Sua conta será desativada e não aparecerá mais em cotações</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Desativar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
