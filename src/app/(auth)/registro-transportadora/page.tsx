'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Truck, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateCarrierCNPJ } from '@/app/actions/cnpj-actions'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RegistroTransportadoraPage() {
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handleVerifyCNPJ = async () => {
    if (cnpj.length < 18) {
      toast.error('Informe o CNPJ completo')
      return
    }

    setLoading(true)
    setError(null)
    setCompanyData(null)

    try {
      const result = await validateCarrierCNPJ(cnpj)
      if (result.success) {
        setCompanyData(result.data)
        // Salva no sessionStorage para evitar URLs longas e erro 500
        sessionStorage.setItem('carrier_data', JSON.stringify({
          cnpj: cnpj.replace(/\D/g, ''),
          razao: result.data.razao_social,
          fantasia: result.data.nome_fantasia,
          role: 'transportadora'
        }))
        toast.success('Empresa validada com sucesso!')
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (err) {
      toast.error('Erro ao conectar com o serviço de validação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-2 border-brand-200 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="RotaClick" width={200} height={100} priority />
          </div>
          <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-2">
            <Truck className="h-8 w-8 text-brand-600" />
          </div>
          <CardTitle className="text-3xl font-black text-brand-700">Seja um Parceiro RotaClick</CardTitle>
          <CardDescription className="text-lg">
            Apenas transportadoras homologadas podem vender fretes em nossa plataforma.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Step 1: CNPJ Verification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">1</span>
              Validação de Segurança
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Transportadora</Label>
                <div className="flex gap-2">
                  <Input 
                    id="cnpj"
                    placeholder="00.000.000/0000-00" 
                    value={cnpj}
                    onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                    className="text-lg py-6 font-mono focus-visible:ring-brand-500"
                  />
                  <Button 
                    onClick={handleVerifyCNPJ} 
                    disabled={loading || cnpj.length < 18}
                    className="px-8 py-6 font-bold bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFICAR'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {companyData && (
            <div className="bg-brand-50 border-2 border-brand-200 rounded-xl p-6 animate-in zoom-in duration-300">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-brand-600 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-bold text-brand-800 text-lg">Empresa Autorizada!</h4>
                  <div className="text-sm text-brand-700 space-y-1">
                    <p><strong>Razão Social:</strong> {companyData.razao_social}</p>
                    <p><strong>CNAE:</strong> {companyData.cnae_principal}</p>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/registro'}
                    className="mt-4 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                  >
                    CONTINUAR PARA O CADASTRO <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 animate-in shake duration-300">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-900 text-lg">Acesso Negado</h4>
                  <p className="text-sm text-red-800">{error}</p>
                  <p className="text-xs text-red-700 mt-2 italic">
                    O RotaClick aceita apenas empresas com CNAE de transporte rodoviário de cargas (Grupo 49.30-2).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Footer */}
          {!companyData && !error && (
            <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg text-xs text-muted-foreground border border-brand-100">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              <p>
                Sua empresa passará por uma verificação automática junto à Receita Federal para garantir a legitimidade das operações.
              </p>
            </div>
          )}

          {/* Link to login */}
          <div className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-semibold">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
