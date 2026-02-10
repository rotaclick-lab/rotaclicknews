'use client'

import { useState } from 'react'
import { Building2, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black">Seja um Parceiro RotaClick</CardTitle>
          <CardDescription className="text-lg">
            Apenas transportadoras homologadas podem vender fretes em nossa plataforma.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Step 1: CNPJ Verification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span>
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
                    className="text-lg py-6 font-mono"
                  />
                  <Button 
                    onClick={handleVerifyCNPJ} 
                    disabled={loading || cnpj.length < 18}
                    className="px-8 py-6 font-bold"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFICAR'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {companyData && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 animate-in zoom-in duration-300">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-bold text-green-900 text-lg">Empresa Autorizada!</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Razão Social:</strong> {companyData.razao_social}</p>
                    <p><strong>CNAE:</strong> {companyData.cnae_principal}</p>
                  </div>
                  <Button asChild className="mt-4 bg-green-600 hover:bg-green-700 font-bold">
                    <Link href={`/registro?cnpj=${cnpj.replace(/\D/g, '')}&role=transportadora`}>
                      CONTINUAR PARA O CADASTRO <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
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
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-xs text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p>
                Sua empresa passará por uma verificação automática junto à Receita Federal para garantir a legitimidade das operações.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { Truck } from 'lucide-react'
