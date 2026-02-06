'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { deleteFreight } from '@/app/actions/freight-actions'

interface FreightDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  freightId: string | null
}

export function FreightDeleteDialog({
  open,
  onOpenChange,
  freightId,
}: FreightDeleteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!freightId) return

    try {
      setIsLoading(true)
      const result = await deleteFreight(freightId)

      if (result.success) {
        toast({
          title: 'Frete excluído',
          description: 'O frete foi excluído com sucesso.',
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: 'Erro ao excluir frete',
          description: result.error || 'Ocorreu um erro ao excluir o frete.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao excluir o frete.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este frete? Esta ação não pode ser
            desfeita e todos os dados relacionados (itens, rastreamento) serão
            removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
