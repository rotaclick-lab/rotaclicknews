'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Lead {
  created_at: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  origin_zip: string | null
  dest_zip: string | null
  origin_city: string | null
  dest_city: string | null
  taxable_weight: number | null
  invoice_value: number | null
  results_count: number
  converted: boolean
}

export function FunnelExport({ leads }: { leads: Lead[] }) {
  const handleExport = () => {
    const header = [
      'Data', 'Nome', 'Email', 'Telefone',
      'CEP Origem', 'Cidade Origem', 'CEP Destino', 'Cidade Destino',
      'Peso Taxável (kg)', 'Valor NF (R$)', 'Qtd Resultados', 'Converteu',
    ]

    const rows = leads.map((l) => [
      new Date(l.created_at).toLocaleDateString('pt-BR'),
      l.contact_name ?? '',
      l.contact_email ?? '',
      l.contact_phone ?? '',
      l.origin_zip ?? '',
      l.origin_city ?? '',
      l.dest_zip ?? '',
      l.dest_city ?? '',
      l.taxable_weight ?? '',
      l.invoice_value ?? '',
      l.results_count,
      l.converted ? 'Sim' : 'Não',
    ])

    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funil-cotacoes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={leads.length === 0}
      className="gap-1.5 border-brand-200 text-brand-700 hover:bg-brand-50"
    >
      <Download className="h-4 w-4" />
      Exportar CSV ({leads.length})
    </Button>
  )
}
