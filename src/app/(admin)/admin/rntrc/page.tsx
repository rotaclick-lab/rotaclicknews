import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RntrcUploadForm } from './rntrc-upload-form'
import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Upload, ExternalLink, AlertCircle } from 'lucide-react'

const ANTT_DATASET_URL = 'https://dados.antt.gov.br/pt_PT/dataset?organization=agencia-nacional-de-transportes-terrestres-antt&tags=rntrc'

export const dynamic = 'force-dynamic'

export default function AdminRntrcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">RNTRC</h1>
        <p className="text-muted-foreground">
          Upload do arquivo CSV de transportadores da ANTT para o cache local
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              Envie o arquivo de transportadores RNTRC (formato ANTT). Separedor: vírgula ou ponto e vírgula.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RntrcUploadForm />
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Como obter o arquivo
            </CardTitle>
            <CardDescription>
              O arquivo de transportadores RNTRC está disponível no Portal de Dados Abertos da ANTT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Acesse o Portal de Dados Abertos da ANTT</li>
              <li>Busque por &quot;RNTRC&quot; ou &quot;transportadores&quot;</li>
              <li>Baixe o arquivo CSV mais recente</li>
              <li>Faça o upload neste painel</li>
            </ol>

            <a
              href={ANTT_DATASET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Portal ANTT
            </a>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Colunas esperadas</p>
                <p className="mt-1 text-amber-700">
                  RNTRC ou NU_RNTRC, CPF_CNPJ ou NU_CPF_CNPJ, SITUACAO ou SG_SITUACAO, RAZAO_SOCIAL ou NO_RAZAO_SOCIAL.
                  O parser tenta mapear automaticamente variações de nomes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <RntrcHistory />
    </div>
  )
}

async function RntrcHistory() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: runs } = await admin
    .from('antt_ingestion_runs')
    .select('created_at, status, records_imported, source_url, error_message')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Histórico de ingestões</CardTitle>
        <CardDescription>Últimas importações de RNTRC</CardDescription>
      </CardHeader>
      <CardContent>
        {!runs?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma ingestão registrada.</p>
        ) : (
          <div className="space-y-2">
      {runs.map((run) => (
        <div
          key={run.created_at}
          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
        >
          <div>
            <span className="font-medium">
              {new Date(run.created_at).toLocaleString('pt-BR')}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {run.source_url} • {run.records_imported} registros
            </span>
            {run.error_message && (
              <p className="text-xs text-red-600 mt-0.5">{run.error_message}</p>
            )}
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              run.status === 'SUCCESS'
                ? 'bg-green-100 text-green-800'
                : run.status === 'FAILED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {run.status}
          </span>
        </div>
      ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
