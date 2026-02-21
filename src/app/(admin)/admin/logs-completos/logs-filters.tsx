'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'

interface LogsFiltersProps {
  actions: string[]
  resources: string[]
  currentAction: string
  currentResource: string
  currentUserId: string
  currentDateFrom: string
  currentDateTo: string
  basePath: string
}

export function LogsFilters({
  actions,
  resources,
  currentAction,
  currentResource,
  currentUserId,
  currentDateFrom,
  currentDateTo,
  basePath,
}: LogsFiltersProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const hasFilters = currentAction || currentResource || currentUserId || currentDateFrom || currentDateTo

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const params = new URLSearchParams()

    const action = (form.elements.namedItem('action') as HTMLSelectElement)?.value
    const resource_type = (form.elements.namedItem('resource_type') as HTMLSelectElement)?.value
    const user_id = (form.elements.namedItem('user_id') as HTMLInputElement)?.value
    const date_from = (form.elements.namedItem('date_from') as HTMLInputElement)?.value
    const date_to = (form.elements.namedItem('date_to') as HTMLInputElement)?.value

    if (action) params.set('action', action)
    if (resource_type) params.set('resource_type', resource_type)
    if (user_id) params.set('user_id', user_id)
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    params.set('page', '1')

    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-4 pb-4">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground">Ação</label>
              <select
                name="action"
                defaultValue={currentAction}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-xs font-medium text-muted-foreground">Recurso</label>
              <select
                name="resource_type"
                defaultValue={currentResource}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {resources.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground">ID do usuário</label>
              <Input
                name="user_id"
                defaultValue={currentUserId}
                placeholder="UUID do usuário..."
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">De</label>
              <Input type="date" name="date_from" defaultValue={currentDateFrom} className="h-9 w-[150px]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Até</label>
              <Input type="date" name="date_to" defaultValue={currentDateTo} className="h-9 w-[150px]" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-9">
                <Search className="h-4 w-4 mr-1" />
                Filtrar
              </Button>
              {hasFilters && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9"
                  onClick={() => router.push(basePath)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
