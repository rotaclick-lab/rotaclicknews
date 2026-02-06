'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { vehicleSchema } from '@/lib/validations/vehicle.schema'
import { createVehicle, updateVehicle } from '@/app/actions/vehicle-actions'
import { VehicleDocumentAlert } from './vehicle-document-alert'
import type { VehicleFormData, VehicleWithRelations } from '@/types/vehicle.types'

interface VehicleFormProps {
  vehicle?: VehicleWithRelations
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          plate: vehicle.plate,
          model: vehicle.model,
          brand: vehicle.brand,
          year: vehicle.year,
          type: vehicle.type,
          capacity_kg: vehicle.capacity_kg || undefined,
          capacity_m3: vehicle.capacity_m3 || undefined,
          fuel_type: vehicle.fuel_type || null,
          color: vehicle.color || null,
          chassis_number: vehicle.chassis_number || null,
          renavam: vehicle.renavam || null,
          crlv_expiry_date: vehicle.crlv_expiry_date || null,
          ipva_expiry_date: vehicle.ipva_expiry_date || null,
          insurance_expiry_date: vehicle.insurance_expiry_date || null,
          insurance_company: vehicle.insurance_company || null,
          insurance_policy_number: vehicle.insurance_policy_number || null,
          last_maintenance_date: vehicle.last_maintenance_date || null,
          last_maintenance_km: vehicle.last_maintenance_km || undefined,
          notes: vehicle.notes || null,
          status: vehicle.status,
        }
      : {
          plate: '',
          model: '',
          brand: '',
          year: new Date().getFullYear(),
          type: 'truck',
          capacity_kg: undefined,
          capacity_m3: undefined,
          fuel_type: null,
          color: null,
          chassis_number: null,
          renavam: null,
          crlv_expiry_date: null,
          ipva_expiry_date: null,
          insurance_expiry_date: null,
          insurance_company: null,
          insurance_policy_number: null,
          last_maintenance_date: null,
          last_maintenance_km: undefined,
          notes: null,
          status: 'active',
        },
  })

  const crlvExpiryDate = form.watch('crlv_expiry_date')
  const ipvaExpiryDate = form.watch('ipva_expiry_date')
  const insuranceExpiryDate = form.watch('insurance_expiry_date')

  const onSubmit = async (data: VehicleFormData) => {
    try {
      setIsLoading(true)

      const result = vehicle
        ? await updateVehicle(vehicle.id, data)
        : await createVehicle(data)

      if (result.success) {
        toast({
          title: vehicle ? 'Veículo atualizado' : 'Veículo criado',
          description: vehicle
            ? 'O veículo foi atualizado com sucesso.'
            : 'O veículo foi criado com sucesso.',
        })

        if (!vehicle && result.data?.id) {
          router.push(`/veiculos/${result.data.id}`)
        } else {
          router.push('/veiculos')
        }
      } else {
        toast({
          title: vehicle ? 'Erro ao atualizar veículo' : 'Erro ao criar veículo',
          description: result.error || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Document Alerts */}
        <VehicleDocumentAlert
          crlvExpiryDate={crlvExpiryDate}
          ipvaExpiryDate={ipvaExpiryDate}
          insuranceExpiryDate={insuranceExpiryDate}
        />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do veículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234 ou ABC1D23"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>Formato antigo ou Mercosul</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Veículo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="truck">Caminhão</SelectItem>
                        <SelectItem value="van">Van/Furgão</SelectItem>
                        <SelectItem value="semi_trailer">Carreta (Semi-reboque)</SelectItem>
                        <SelectItem value="trailer">Reboque</SelectItem>
                        <SelectItem value="pickup">Picape</SelectItem>
                        <SelectItem value="motorcycle">Moto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mercedes, Volvo, etc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Atego 1719" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Branco" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <FormControl>
                      <Input placeholder="Diesel, Gasolina, etc" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="maintenance">Em Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Capacidade de Carga</CardTitle>
            <CardDescription>Informações sobre a capacidade do veículo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="capacity_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade em Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Peso máximo que o veículo pode transportar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity_m3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade em Volume (m³)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="20"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Volume máximo em metros cúbicos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos do Veículo</CardTitle>
            <CardDescription>Informações sobre documentação e identificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="chassis_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Chassi</FormLabel>
                    <FormControl>
                      <Input placeholder="9BW..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renavam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RENAVAM</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678901" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>9 a 11 dígitos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="crlv_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade CRLV</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Licenciamento anual</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ipva_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento IPVA</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurance_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento Seguro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="insurance_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da seguradora" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurance_policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Apólice</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da apólice do seguro" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Manutenção</CardTitle>
            <CardDescription>Informações sobre manutenções realizadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="last_maintenance_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Última Manutenção</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_maintenance_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM da Última Manutenção</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="150000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>Informações adicionais sobre o veículo</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o veículo"
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {vehicle ? 'Atualizar Veículo' : 'Criar Veículo'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
