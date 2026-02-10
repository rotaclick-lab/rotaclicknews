import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export default async function NovaRotaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publicar Nova Rota</h1>
        <p className="text-muted-foreground">
          Informe os detalhes da rota disponível para frete de retorno
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Formulário completo em desenvolvimento. Em breve você poderá publicar rotas de retorno diretamente aqui.
        </AlertDescription>
      </Alert>

      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">
            O formulário de publicação de rotas será adicionado em breve com todos os campos necessários.
          </p>
        </div>
      </Card>
    </div>
  )
}
