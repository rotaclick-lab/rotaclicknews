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
import { deleteVehicle } from '@/app/actions/vehicle-actions'

interface VehicleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string | null
  vehiclePlate?: string | undefined
}

export function VehicleDeleteDialog({
  open,
  onOpenChange,
  vehicleId,
  vehiclePlate,
}: VehicleDeleteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!vehicleId) return

    try {
      setIsLoading(true)
      const result = await deleteVehicle(vehicleId)

      if (result.success) {
        toast({
          title: 'Veículo excluído',
          description: 'O veículo foi excluído com sucesso.',
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: 'Erro ao excluir veículo',
          description: result.error || 'Ocorreu um erro ao excluir o veículo.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao excluir o veículo.',
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
            Tem certeza que deseja excluir o veículo{' '}
            <strong>{vehiclePlate}</strong>? Esta ação não pode ser desfeita.
            {'\n\n'}
            Nota: Veículos com fretes associados não podem ser excluídos.
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
