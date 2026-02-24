'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Power, PowerOff, Settings2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type CarrierIntegration,
  type IntegrationType,
  upsertCarrierIntegration,
  toggleCarrierIntegration,
  deleteCarrierIntegration,
} from '@/app/actions/admin-actions'

const INTEGRATION_LABELS: Record<IntegrationType, string> = {
  ssw: 'SSW',
  intelipost: 'Intelipost',
  mandae: 'Mandaê',
  correios: 'Correios',
  manual: 'Manual (tabela própria)',
}

const INTEGRATION_COLORS: Record<IntegrationType, string> = {
  ssw: 'bg-blue-100 text-blue-700',
  intelipost: 'bg-purple-100 text-purple-700',
  mandae: 'bg-orange-100 text-orange-700',
  correios: 'bg-yellow-100 text-yellow-700',
  manual: 'bg-slate-100 text-slate-700',
}

const CONFIG_FIELDS: Record<IntegrationType, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  ssw: [
    { key: 'dominio', label: 'Domínio SSW', placeholder: 'ex: minhatransportadora' },
    { key: 'cnpj_pagador', label: 'CNPJ Pagador (RotaClick no SSW)', placeholder: '00.000.000/0001-00' },
    { key: 'senha', label: 'Senha SSW', placeholder: 'Senha fornecida pela transportadora', secret: true },
  ],
  intelipost: [
    { key: 'api_key', label: 'API Key', placeholder: 'Chave de API Intelipost', secret: true },
    { key: 'shipper_id', label: 'Shipper ID', placeholder: 'ID do remetente' },
  ],
  mandae: [
    { key: 'api_key', label: 'API Key', placeholder: 'Chave de API Mandaê', secret: true },
    { key: 'store_id', label: 'Store ID', placeholder: 'ID da loja' },
  ],
  correios: [
    { key: 'usuario', label: 'Usuário', placeholder: 'Usuário dos Correios' },
    { key: 'senha', label: 'Senha', placeholder: 'Senha dos Correios', secret: true },
    { key: 'contrato', label: 'Contrato', placeholder: 'Número do contrato' },
    { key: 'cartao_postagem', label: 'Cartão de Postagem', placeholder: 'Número do cartão' },
  ],
  manual: [
    { key: 'observacao', label: 'Observação', placeholder: 'Esta transportadora usa tabela própria cadastrada no sistema' },
  ],
}

interface Company {
  id: string
  name: string
  cnpj: string
  document: string
  logo_url?: string
}

interface Props {
  integrations: CarrierIntegration[]
  companies: Company[]
}

export function IntegracoesPlataformaList({ integrations, companies }: Props) {
  const [list, setList] = useState<CarrierIntegration[]>(integrations)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<{
    id?: string
    companyId: string
    integrationType: IntegrationType
    config: Record<string, string>
    notes: string
    negotiatedAt: string
    isActive: boolean
  }>({
    companyId: '',
    integrationType: 'ssw',
    config: {},
    notes: '',
    negotiatedAt: '',
    isActive: true,
  })

  function openNew() {
    setForm({ companyId: '', integrationType: 'ssw', config: {}, notes: '', negotiatedAt: '', isActive: true })
    setDialogOpen(true)
  }

  function openEdit(integration: CarrierIntegration) {
    setForm({
      id: integration.id,
      companyId: integration.company_id,
      integrationType: integration.integration_type,
      config: { ...integration.config },
      notes: integration.notes ?? '',
      negotiatedAt: integration.negotiated_at ?? '',
      isActive: integration.is_active,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.companyId || !form.integrationType) {
      toast.error('Selecione a transportadora e o tipo de integração.')
      return
    }
    setSaving(true)
    const result = await upsertCarrierIntegration({
      companyId: form.companyId,
      integrationType: form.integrationType,
      config: form.config,
      notes: form.notes || undefined,
      negotiatedAt: form.negotiatedAt || undefined,
      isActive: form.isActive,
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Integração salva com sucesso!')
    setDialogOpen(false)
    window.location.reload()
  }

  async function handleToggle(id: string, current: boolean) {
    const result = await toggleCarrierIntegration(id, !current)
    if (!result.success) { toast.error(result.error); return }
    toast.success(current ? 'Integração desativada.' : 'Integração ativada.')
    setList(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteCarrierIntegration(deleteId)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Integração removida.')
    setList(prev => prev.filter(i => i.id !== deleteId))
    setDeleteId(null)
  }

  const fields = CONFIG_FIELDS[form.integrationType] ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-brand-500 hover:bg-brand-600">
          <Plus className="h-4 w-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma integração cadastrada ainda.</p>
          <p className="text-sm mt-1">Clique em "Nova Integração" para começar.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transportadora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Negociado em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell className="font-medium">
                  {integration.company?.name ?? integration.company_id}
                  {integration.company?.cnpj && (
                    <span className="block text-xs text-muted-foreground">{integration.company.cnpj || integration.company.document}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${INTEGRATION_COLORS[integration.integration_type]}`}>
                    {INTEGRATION_LABELS[integration.integration_type]}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {integration.negotiated_at
                    ? new Date(integration.negotiated_at).toLocaleDateString('pt-BR')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={integration.is_active ? 'default' : 'secondary'}
                    className={integration.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                    {integration.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                  {integration.notes ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(integration.id, integration.is_active)}
                      title={integration.is_active ? 'Desativar' : 'Ativar'}>
                      {integration.is_active
                        ? <PowerOff className="h-4 w-4 text-slate-500" />
                        : <Power className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(integration)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(integration.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar Integração' : 'Nova Integração de Plataforma'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Transportadora */}
            <div className="space-y-1">
              <Label>Transportadora *</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm(f => ({ ...f, companyId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a transportadora..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.cnpj || c.document}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de integração */}
            <div className="space-y-1">
              <Label>Tipo de TMS *</Label>
              <Select
                value={form.integrationType}
                onValueChange={(v) => setForm(f => ({ ...f, integrationType: v as IntegrationType, config: {} }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos dinâmicos por tipo */}
            {fields.map(field => (
              <div key={field.key} className="space-y-1">
                <Label>{field.label}</Label>
                <Input
                  type={field.secret ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={form.config[field.key] ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, config: { ...f.config, [field.key]: e.target.value } }))}
                />
              </div>
            ))}

            {/* Data da negociação */}
            <div className="space-y-1">
              <Label>Data da Negociação</Label>
              <Input
                type="date"
                value={form.negotiatedAt}
                onChange={(e) => setForm(f => ({ ...f, negotiatedAt: e.target.value }))}
              />
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <Label>Observações internas</Label>
              <Textarea
                placeholder="Ex: Tabela negociada em reunião com o gerente comercial. Vigência até dez/2025."
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-500 hover:bg-brand-600">
              {saving ? 'Salvando...' : 'Salvar Integração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover integração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A integração será removida e a transportadora não terá mais cotação automática por este TMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
