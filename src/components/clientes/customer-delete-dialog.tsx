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
import { deleteCustomer } from '@/app/actions/customer-actions'

interface CustomerDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string | null
  customerName?: string | undefined
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerDeleteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!customerId) return

    try {
      setIsLoading(true)
      const result = await deleteCustomer(customerId)

      if (result.success) {
        toast({
          title: 'Cliente excluído',
          description: 'O cliente foi excluído com sucesso.',
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: 'Erro ao excluir cliente',
          description: result.error || 'Ocorreu um erro ao excluir o cliente.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao excluir o cliente.',
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
            Tem certeza que deseja excluir o cliente{' '}
            <strong>{customerName}</strong>? Esta ação não pode ser desfeita.
            {'\n\n'}
            Nota: Clientes com fretes associados não podem ser excluídos.
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
