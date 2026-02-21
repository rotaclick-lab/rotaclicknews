'use client'

import { useState, useRef, useEffect } from 'react'
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
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'

export default function PerfilPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [activeSection, setActiveSection] = useState<'perfil' | 'empresa' | 'configuracoes'>('perfil')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Dados do perfil
  const [perfil, setPerfil] = useState({
    nomeCompleto: '',
    cpf: '',
    cargo: '',
    email: '',
    telefone: '',
    celular: '',
  })

  // Dados da empresa
  const [empresa, setEmpresa] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    logoUrl: '' as string | null,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })
  const companyLogoRef = useRef<HTMLInputElement>(null)

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

  // Carregar dados do usuário logado
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Buscar profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError)
        }

        if (profile) {
          setPerfil({
            nomeCompleto: profile.name || '',
            cpf: formatCPF(profile.cpf || ''),
            cargo: profile.role === 'carrier' ? 'Transportador' : profile.role || '',
            email: profile.email || user.email || '',
            telefone: profile.phone ? formatPhone(profile.phone) : '',
            celular: profile.phone ? formatCelular(profile.phone) : '',
          })

          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url)
          }

          setConfig(prev => ({
            ...prev,
            notificacaoEmail: profile.accept_communications ?? true,
            notificacaoCotacao: profile.whatsapp_permission ?? true,
          }))

          // Buscar empresa vinculada
          if (profile.company_id) {
            setCompanyId(profile.company_id)
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', profile.company_id)
              .single()

            if (companyError) {
              console.error('Erro ao buscar empresa:', companyError)
            }

            if (company) {
              const endereco = company.endereco_completo || company.address || {}
              setEmpresa(prev => ({
                ...prev,
                razaoSocial: company.razao_social || company.name || '',
                nomeFantasia: company.nome_fantasia || '',
                cnpj: formatCNPJ(company.cnpj || company.document || ''),
                inscricaoEstadual: company.inscricao_estadual || '',
                logoUrl: company.logo_url || null,
                cep: formatCEP(company.postal_code || endereco.cep || ''),
                logradouro: endereco.logradouro || '',
                numero: endereco.numero || '',
                complemento: endereco.complemento || '',
                bairro: endereco.bairro || '',
                cidade: company.city || endereco.cidade || '',
                estado: company.state || endereco.uf || '',
              }))
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados do perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Formatadores
  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, '')
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '')
    return clean
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '')
    return clean.replace(/(\d{5})(\d)/, '$1-$2')
  }

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '')
    if (clean.length <= 10) {
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return clean
  }

  const formatCelular = (value: string) => {
    const clean = value.replace(/\D/g, '')
    if (clean.length >= 10) {
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
    }
    return clean
  }

  // Máscaras para input
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP')
      return
    }

    // Preview imediato
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload para o Supabase Storage
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        toast.info('Foto atualizada localmente. O upload será salvo ao clicar em Salvar.')
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        setAvatarPreview(urlData.publicUrl)
        toast.success('Foto atualizada com sucesso!')
      }
    } catch {
      toast.info('Foto atualizada localmente.')
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      // Salvar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: perfil.nomeCompleto,
          email: perfil.email,
          phone: perfil.celular.replace(/\D/g, ''),
          accept_communications: config.notificacaoEmail,
          whatsapp_permission: config.notificacaoCotacao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError)
        toast.error('Erro ao salvar dados do perfil')
        setSaving(false)
        return
      }

      // Salvar empresa (se vinculada)
      if (companyId) {
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            nome_fantasia: empresa.nomeFantasia,
            inscricao_estadual: empresa.inscricaoEstadual,
            postal_code: empresa.cep.replace(/\D/g, ''),
            city: empresa.cidade,
            state: empresa.estado,
            endereco_completo: {
              logradouro: empresa.logradouro,
              numero: empresa.numero,
              complemento: empresa.complemento,
              bairro: empresa.bairro,
              cidade: empresa.cidade,
              uf: empresa.estado,
              cep: empresa.cep.replace(/\D/g, ''),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId)

        if (companyError) {
          console.error('Erro ao salvar empresa:', companyError)
          toast.error('Erro ao salvar dados da empresa')
          setSaving(false)
          return
        }
      }

      toast.success('Dados salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar dados')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!senha.nova || !senha.confirmar) {
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
    try {
      const { error } = await supabase.auth.updateUser({ password: senha.nova })
      if (error) {
        toast.error(error.message)
      } else {
        setSenha({ atual: '', nova: '', confirmar: '' })
        toast.success('Senha alterada com sucesso!')
      }
    } catch {
      toast.error('Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O logo deve ter no máximo 2MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP')
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${companyId}/logo.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error('Erro no upload do logo:', uploadError)
        toast.error('Não foi possível enviar o logo. Verifique as permissões.')
        return
      }

      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(fileName)

      await supabase
        .from('companies')
        .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', companyId)

      setEmpresa(prev => ({ ...prev, logoUrl: urlData.publicUrl }))
      toast.success('Logo atualizado com sucesso!')
    } catch {
      toast.error('Erro ao atualizar logo')
    }
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

  if (loading) {
    return (
      <div className="min-h-screen pb-20 animate-in fade-in duration-300">
        <div className="max-w-5xl mx-auto">
          {/* Skeleton Header */}
          <div className="relative mb-8">
            <div className="h-40 rounded-2xl bg-gradient-to-r from-brand-100 to-brand-50 animate-pulse" />
            <div className="absolute -bottom-12 left-8 flex items-end gap-4">
              <div className="w-28 h-28 rounded-2xl border-4 border-white bg-muted animate-pulse" />
              <div className="mb-2 space-y-2">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-8" />
          {/* Skeleton Tabs */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
          {/* Skeleton Cards */}
          <div className="space-y-6">
            <div className="h-64 rounded-xl border border-brand-100 bg-white animate-pulse" />
            <div className="h-48 rounded-xl border border-brand-100 bg-white animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header do Perfil */}
        <div className="relative mb-10">
          {/* Banner */}
          <div className="h-36 md:h-44 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2LTRoMnY0aDR2MmgtNHY0aC0ydi00em0wLTMwaC0ydi00aDJ2LTRoMnY0aDR2MmgtNHY0aC0ydi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
            <div className="absolute bottom-4 left-8 right-8">
              <p className="text-white/90 text-sm font-medium">Meu Perfil</p>
            </div>
          </div>

          {/* Avatar + Nome */}
          <div className="absolute -bottom-14 left-6 md:left-8 flex items-end gap-5">
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden ring-2 ring-brand-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                    <User className="h-10 w-10 md:h-12 md:w-12 text-brand-500" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="mb-1 pb-1">
              <h1 className="text-xl md:text-2xl font-bold text-brand-900 tracking-tight">
                {perfil.nomeCompleto || 'Sem nome'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {empresa.nomeFantasia || empresa.razaoSocial || 'Empresa não vinculada'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-16" />

        {/* Tabs de Seção */}
        <div className="flex gap-1 p-1 mb-8 rounded-xl bg-muted/50 border border-brand-100/80 w-fit">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  activeSection === section.id
                    ? 'text-brand-700 bg-white shadow-sm border border-brand-100'
                    : 'text-muted-foreground hover:text-brand-600 hover:bg-white/60'
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
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
                      placeholder="(00) 0000-0000"
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Celular / WhatsApp</Label>
                    <Input
                      value={perfil.celular}
                      onChange={(e) => setPerfil({ ...perfil, celular: maskCelular(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Lock className="h-5 w-5 text-orange-500" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Defina uma nova senha para sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={senha.nova}
                        onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                        className="focus-visible:ring-brand-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={senha.confirmar}
                      onChange={(e) => setSenha({ ...senha, confirmar: e.target.value })}
                      placeholder="Repita a nova senha"
                      className="focus-visible:ring-brand-500"
                    />
                  </div>
                </div>
                {senha.nova && senha.confirmar && senha.nova !== senha.confirmar && (
                  <p className="text-sm text-red-500">As senhas não coincidem</p>
                )}
                {senha.nova && senha.confirmar && senha.nova === senha.confirmar && senha.nova.length >= 8 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Senhas coincidem
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-brand-300 text-brand-700 hover:bg-brand-50"
                    onClick={handleChangePassword}
                    disabled={saving || !senha.nova || !senha.confirmar || senha.nova !== senha.confirmar}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    Alterar Senha
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
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        )}

        {/* Seção: Empresa */}
        {activeSection === 'empresa' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!companyId ? (
              <Card className="border-brand-100 shadow-sm border-dashed">
                <CardContent className="py-16 text-center">
                  <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-brand-800 mb-2">Empresa não vinculada</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Seu perfil ainda não está vinculado a uma empresa. Entre em contato com o suporte para concluir o cadastro da transportadora.
                  </p>
                  <Button variant="outline" className="border-brand-200 text-brand-700" asChild>
                    <a href="mailto:suporte@rotaclick.com.br">Falar com suporte</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <>
            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <Building2 className="h-5 w-5 text-brand-500" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>Informações da transportadora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-xl border-2 border-brand-100 bg-brand-50/50 overflow-hidden flex items-center justify-center">
                      {empresa.logoUrl ? (
                        <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="h-10 w-10 text-brand-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => companyLogoRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </button>
                    <input
                      ref={companyLogoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCompanyLogoChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-brand-800">Logotipo da transportadora</p>
                    <p className="text-sm text-muted-foreground">Clique para enviar. JPG, PNG ou WebP. Máx. 2MB.</p>
                  </div>
                </div>
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
                    <Input value={empresa.cnpj} disabled className="bg-gray-50" />
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

            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-800">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Endereço
                </CardTitle>
                <CardDescription>Endereço da sede da transportadora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={empresa.cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      placeholder="00000-000"
                      className="focus-visible:ring-brand-500"
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
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map(uf => (
                        <option key={uf.value} value={uf.value}>{uf.label}</option>
                      ))}
                    </select>
                  </div>
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
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
            </>
            )}
          </div>
        )}

        {/* Seção: Configurações */}
        {activeSection === 'configuracoes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" id="configuracoes">
            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
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

            <Card className="border-brand-100 shadow-sm hover:shadow-md transition-shadow">
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
