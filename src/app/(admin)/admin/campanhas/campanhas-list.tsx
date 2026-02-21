'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink, Megaphone } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  createCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus,
  type Campaign,
} from '@/app/actions/platform-actions'

const TYPE_LABELS: Record<string, string> = {
  banner: 'Banner',
  featured_carrier: 'Transportadora Destaque',
  promo: 'Promoção',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-blue-100 text-blue-800',
}

function CampaignForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Campaign>
  onSubmit: (data: Record<string, string>) => void
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Título *</Label>
          <Input name="title" defaultValue={initial?.title ?? ''} required placeholder="Ex: Frete grátis no primeiro envio" />
        </div>
        <div className="col-span-2">
          <Label>Descrição</Label>
          <Input name="description" defaultValue={initial?.description ?? ''} placeholder="Texto de apoio" />
        </div>
        <div>
          <Label>Tipo</Label>
          <select name="type" defaultValue={initial?.type ?? 'banner'} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="banner">Banner</option>
            <option value="featured_carrier">Transportadora Destaque</option>
            <option value="promo">Promoção</option>
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select name="status" defaultValue={initial?.status ?? 'active'} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="scheduled">Agendado</option>
          </select>
        </div>
        <div className="col-span-2">
          <Label>URL da imagem</Label>
          <Input name="image_url" defaultValue={initial?.image_url ?? ''} placeholder="https://..." />
        </div>
        <div>
          <Label>Link (URL)</Label>
          <Input name="link_url" defaultValue={initial?.link_url ?? ''} placeholder="https://..." />
        </div>
        <div>
          <Label>Label do botão</Label>
          <Input name="link_label" defaultValue={initial?.link_label ?? ''} placeholder="Saiba mais" />
        </div>
        <div>
          <Label>Cor de fundo</Label>
          <div className="flex gap-2 items-center">
            <Input name="bg_color" defaultValue={initial?.bg_color ?? '#2BBCB3'} placeholder="#2BBCB3" className="flex-1" />
          </div>
        </div>
        <div>
          <Label>Cor do texto</Label>
          <Input name="text_color" defaultValue={initial?.text_color ?? '#FFFFFF'} placeholder="#FFFFFF" />
        </div>
        <div>
          <Label>Posição (ordem)</Label>
          <Input name="position" type="number" defaultValue={String(initial?.position ?? 0)} min="0" />
        </div>
        <div>
          <Label>Início</Label>
          <Input name="starts_at" type="datetime-local" defaultValue={initial?.starts_at?.slice(0, 16) ?? ''} />
        </div>
        <div>
          <Label>Fim</Label>
          <Input name="ends_at" type="datetime-local" defaultValue={initial?.ends_at?.slice(0, 16) ?? ''} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function CampanhasList({ campaigns: initial }: { campaigns: Campaign[] }) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initial)
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Campaign | null>(null)
  const [deleteItem, setDeleteItem] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)

  const collectForm = (form: HTMLFormElement): Record<string, string> => {
    const fd = new FormData(form)
    const out: Record<string, string> = {}
    fd.forEach((v, k) => { out[k] = String(v) })
    return out
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = collectForm(e.currentTarget)
    if (!data.title) { toast.error('Título obrigatório'); return }
    setLoading(true)
    const res = await createCampaign({
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      status: data.status,
      image_url: data.image_url || undefined,
      link_url: data.link_url || undefined,
      link_label: data.link_label || undefined,
      bg_color: data.bg_color || undefined,
      text_color: data.text_color || undefined,
      position: Number(data.position) || 0,
      starts_at: data.starts_at || undefined,
      ends_at: data.ends_at || undefined,
    })
    setLoading(false)
    if (res.success && res.data) {
      toast.success('Campanha criada')
      setCampaigns((prev) => [res.data!, ...prev])
      setCreateOpen(false)
    } else {
      toast.error(res.error ?? 'Erro ao criar')
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editItem) return
    const data = collectForm(e.currentTarget)
    setLoading(true)
    const res = await updateCampaign(editItem.id, {
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      image_url: data.image_url,
      link_url: data.link_url,
      link_label: data.link_label,
      bg_color: data.bg_color,
      text_color: data.text_color,
      position: Number(data.position) || 0,
      starts_at: data.starts_at || undefined,
      ends_at: data.ends_at || undefined,
    })
    setLoading(false)
    if (res.success) {
      toast.success('Campanha atualizada')
      router.refresh()
      setEditItem(null)
    } else {
      toast.error(res.error ?? 'Erro ao atualizar')
    }
  }

  const handleToggle = async (c: Campaign) => {
    const res = await toggleCampaignStatus(c.id)
    if (res.success) {
      toast.success(res.status === 'active' ? 'Campanha ativada' : 'Campanha desativada')
      setCampaigns((prev) => prev.map((x) => x.id === c.id ? { ...x, status: res.status! } : x))
    } else {
      toast.error(res.error ?? 'Erro')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setLoading(true)
    const res = await deleteCampaign(deleteItem.id)
    setLoading(false)
    if (res.success) {
      toast.success('Campanha excluída')
      setCampaigns((prev) => prev.filter((x) => x.id !== deleteItem.id))
      setDeleteItem(null)
    } else {
      toast.error(res.error ?? 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova campanha
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Megaphone className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada ainda.</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>Criar primeira campanha</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posição</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div
                    className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: c.bg_color ?? '#2BBCB3', color: c.text_color ?? '#fff' }}
                  >
                    {c.title.slice(0, 2).toUpperCase()}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div>{c.title}</div>
                  {c.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</div>}
                  {c.link_url && (
                    <a href={c.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                      <ExternalLink className="h-3 w-3" /> {c.link_label || c.link_url}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[c.type] ?? c.type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASSES[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {c.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{c.position}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.starts_at ? new Date(c.starts_at).toLocaleDateString('pt-BR') : '—'}
                  {' → '}
                  {c.ends_at ? new Date(c.ends_at).toLocaleDateString('pt-BR') : '∞'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      title={c.status === 'active' ? 'Desativar' : 'Ativar'}
                      onClick={() => handleToggle(c)}
                    >
                      {c.status === 'active'
                        ? <ToggleRight className="h-4 w-4 text-green-600" />
                        : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteItem(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}>
            <CampaignForm onSubmit={() => {}} loading={loading} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar campanha</DialogTitle></DialogHeader>
          {editItem && (
            <form onSubmit={handleEdit}>
              <CampaignForm initial={editItem} onSubmit={() => {}} loading={loading} />
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha <strong>{deleteItem?.title}</strong> será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
