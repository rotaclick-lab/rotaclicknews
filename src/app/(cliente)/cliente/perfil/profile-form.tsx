'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateClienteProfile, changeClientePassword } from '@/app/actions/cliente-profile-actions'
import type { ClienteProfileData } from '@/app/actions/cliente-profile-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, MapPin, Lock, Loader2, CheckCircle2 } from 'lucide-react'

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}
function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}
function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}
function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

interface Props {
  initialData: ClienteProfileData & { email: string; created_at: string }
}

export function ProfileForm({ initialData }: Props) {
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)

  const [phoneVal, setPhoneVal] = useState(
    initialData.phone ? maskPhone(initialData.phone) : ''
  )
  const [cpfVal, setCpfVal] = useState(
    initialData.cpf ? maskCPF(initialData.cpf) : ''
  )
  const [cnpjVal, setCnpjVal] = useState(
    initialData.cnpj ? maskCNPJ(initialData.cnpj) : ''
  )
  const [cepVal, setCepVal] = useState(
    initialData.cep ? maskCEP(initialData.cep) : ''
  )

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClienteProfileData>({
    defaultValues: initialData,
  })

  const personType = watch('person_type')

  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const handleCepBlur = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('street', data.logradouro ?? '')
        setValue('neighborhood', data.bairro ?? '')
        setValue('city', data.localidade ?? '')
        setValue('state', data.uf ?? '')
      }
    } catch { /* silent */ } finally {
      setLoadingCep(false)
    }
  }

  const onSubmitProfile = async (data: ClienteProfileData) => {
    setSavingProfile(true)
    const result = await updateClienteProfile(data)
    setSavingProfile(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Perfil atualizado com sucesso!')
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      toast.error('Preencha todos os campos de senha.')
      return
    }
    if (newPass.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPass !== confirmPass) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }
    setSavingPassword(true)
    const result = await changeClientePassword(currentPass, newPass)
    setSavingPassword(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Senha alterada com sucesso!')
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Dados Pessoais ── */}
      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <User className="h-4 w-4 text-brand-500" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de pessoa */}
            <div className="flex gap-3">
              {(['pf', 'pj'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('person_type', t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    personType === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  placeholder="Seu nome"
                  className="focus-visible:ring-brand-500"
                  {...register('full_name', { required: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={initialData.email}
                  disabled
                  className="bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">O email não pode ser alterado aqui.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  className="focus-visible:ring-brand-500"
                  value={phoneVal}
                  onChange={(e) => {
                    const m = maskPhone(e.target.value)
                    setPhoneVal(m)
                    setValue('phone', m)
                  }}
                />
              </div>

              {personType === 'pf' ? (
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    className="focus-visible:ring-brand-500"
                    value={cpfVal}
                    onChange={(e) => {
                      const m = maskCPF(e.target.value)
                      setCpfVal(m)
                      setValue('cpf', m)
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>CNPJ</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    className="focus-visible:ring-brand-500"
                    value={cnpjVal}
                    onChange={(e) => {
                      const m = maskCNPJ(e.target.value)
                      setCnpjVal(m)
                      setValue('cnpj', m)
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Endereço ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-orange-500" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>CEP</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    placeholder="00000-000"
                    className="focus-visible:ring-brand-500"
                    value={cepVal}
                    onChange={(e) => {
                      const m = maskCEP(e.target.value)
                      setCepVal(m)
                      setValue('cep', m)
                    }}
                    onBlur={() => handleCepBlur(cepVal)}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Logradouro</Label>
              <Input placeholder="Rua, Av., etc." className="focus-visible:ring-brand-500" {...register('street')} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input placeholder="123" className="focus-visible:ring-brand-500" {...register('number')} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Complemento</Label>
                <Input placeholder="Apto, sala, etc." className="focus-visible:ring-brand-500" {...register('complement')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input placeholder="Bairro" className="focus-visible:ring-brand-500" {...register('neighborhood')} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Cidade</Label>
                <Input placeholder="Cidade" className="focus-visible:ring-brand-500" {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  className="focus-visible:ring-brand-500 uppercase"
                  {...register('state')}
                  onChange={(e) => setValue('state', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={savingProfile}
          className="w-full h-11 bg-brand-500 hover:bg-brand-600 text-white font-bold"
        >
          {savingProfile ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Salvar alterações</>
          )}
        </Button>
      </form>

      {/* ── Alterar Senha ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
            <Lock className="h-4 w-4 text-slate-500" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Senha atual</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="focus-visible:ring-brand-500"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="focus-visible:ring-brand-500"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              className="focus-visible:ring-brand-500"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={savingPassword}
            className="w-full h-11 border-brand-200 text-brand-700 hover:bg-brand-50 font-semibold"
            onClick={handlePasswordChange}
          >
            {savingPassword ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Alterando...</>
            ) : (
              <><Lock className="mr-2 h-4 w-4" /> Alterar senha</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
