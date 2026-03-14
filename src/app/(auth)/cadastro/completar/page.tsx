'use client'

import { useRef, useState } from 'react'
import { completeOAuthProfile } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/logo'
import { MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'

type PersonType = 'pf' | 'pj'

const maskPhone = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)

const maskCPF = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)

const maskCNPJ = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)

const maskCEP = (v: string) =>
  v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)

export default function CompletarCadastroPage() {
  const [personType, setPersonType] = useState<PersonType>('pf')
  const [isLoading, setIsLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [stateUF, setStateUF] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')

  const formRef = useRef<HTMLFormElement>(null)

  async function handleCEP(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`/api/viacep/${digits}`)
        const json = await res.json()
        if (json?.logradouro) {
          setStreet(json.logradouro)
          setNeighborhood(json.bairro)
          setCity(json.localidade)
          setStateUF(json.uf)
        }
      } catch { /* ignore */ }
      setCepLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptTerms) {
      toast.error('Aceite os termos para continuar.')
      return
    }
    setIsLoading(true)
    const fd = new FormData(formRef.current!)
    fd.set('acceptTerms', String(acceptTerms))
    const result = await completeOAuthProfile(fd)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Logo width={160} height={50} className="h-12 w-auto mx-auto mb-4" priority />
          <h1 className="text-2xl font-bold text-gray-900">Complete seu cadastro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Precisamos de mais alguns dados para ativar sua conta.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

            {/* Tipo de pessoa */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-brand-500" /> Tipo de cadastro
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(['pf', 'pj'] as PersonType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPersonType(t)}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      personType === t
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="personType" value={personType} />
            </div>

            {/* CPF ou CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="doc">{personType === 'pf' ? 'CPF' : 'CNPJ'}</Label>
              <Input
                id="doc"
                name={personType === 'pf' ? 'cpf' : 'cnpj'}
                inputMode="numeric"
                placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={personType === 'pf' ? cpf : cnpj}
                onChange={(e) => personType === 'pf' ? setCpf(maskCPF(e.target.value)) : setCnpj(maskCNPJ(e.target.value))}
                className="h-12 rounded-lg"
                disabled={isLoading}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-500" /> Telefone / WhatsApp
              </Label>
              <Input
                id="phone"
                name="phone"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                className="h-12 rounded-lg"
                disabled={isLoading}
              />
            </div>

            {/* Endereço */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" /> Endereço
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="cep" className="text-xs text-gray-500">CEP</Label>
                    <Input
                      id="cep"
                      name="cep"
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => {
                        const masked = maskCEP(e.target.value)
                        setCep(masked)
                        handleCEP(masked)
                      }}
                      className="h-11 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs text-gray-500">UF</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="SP"
                      maxLength={2}
                      value={stateUF}
                      onChange={(e) => setStateUF(e.target.value.toUpperCase())}
                      className="h-11 rounded-lg uppercase"
                      disabled={isLoading || cepLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="street" className="text-xs text-gray-500">Logradouro</Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="Rua, Avenida..."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-11 rounded-lg"
                    disabled={isLoading || cepLoading}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="number" className="text-xs text-gray-500">Número</Label>
                    <Input
                      id="number"
                      name="number"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="h-11 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="complement" className="text-xs text-gray-500">Complemento</Label>
                    <Input
                      id="complement"
                      name="complement"
                      placeholder="Apto, Sala... (opcional)"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="h-11 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="neighborhood" className="text-xs text-gray-500">Bairro</Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="h-11 rounded-lg"
                      disabled={isLoading || cepLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs text-gray-500">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-11 rounded-lg"
                      disabled={isLoading || cepLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Termos */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                <ShieldCheck className="h-4 w-4 text-brand-500 inline mr-1" />
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-brand-600 underline">Termos de Uso</a>
                {' '}e a{' '}
                <a href="/privacidade" target="_blank" className="text-brand-600 underline">Política de Privacidade</a>.
              </label>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base"
              disabled={isLoading || !acceptTerms}
            >
              {isLoading ? 'Salvando...' : 'Concluir cadastro'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
