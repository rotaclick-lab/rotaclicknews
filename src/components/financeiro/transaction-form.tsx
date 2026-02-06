'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createTransaction, updateTransaction } from '@/app/actions/transaction-actions'
import type { Transaction, TransactionCategory } from '@/types/financial.types'
import { PAYMENT_METHOD_LABELS } from '@/types/financial.types'

interface TransactionFormProps {
  transaction?: Transaction
  categories?: TransactionCategory[]
  defaultType?: 'income' | 'expense'
}

export function TransactionForm({ 
  transaction, 
  categories = [],
  defaultType = 'expense'
}: TransactionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [type, setType] = useState(transaction?.type || defaultType)
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount || 0)
  const [dueDate, setDueDate] = useState(
    transaction?.due_date ? new Date(transaction.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState(transaction?.status || 'pending')
  const [paymentDate, setPaymentDate] = useState(
    transaction?.payment_date ? new Date(transaction.payment_date).toISOString().split('T')[0] : ''
  )
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || '')
  const [referenceNumber, setReferenceNumber] = useState(transaction?.reference_number || '')
  const [notes, setNotes] = useState(transaction?.notes || '')

  const filteredCategories = categories.filter(c => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData: any = {
      type,
      category_id: categoryId,
      description,
      amount: Number(amount),
      due_date: dueDate,
      status,
      payment_date: paymentDate || null,
      payment_method: paymentMethod || null,
      reference_number: referenceNumber || null,
      notes: notes || null,
      is_recurring: false,
    }

    const result = transaction
      ? await updateTransaction(transaction.id, formData)
      : await createTransaction(formData)

    if (result.success) {
      toast.success(transaction ? 'Transação atualizada!' : 'Transação criada!')
      router.push('/financeiro')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao salvar')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipo e Categoria</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento de frete #123" 
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Número de Referência (opcional)</Label>
            <Input 
              value={referenceNumber} 
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ex: NF-12345" 
            />
          </div>
        </CardContent>
      </Card>

      {status === 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input 
                type="date" 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : transaction ? 'Atualizar' : 'Criar Transação'}
        </Button>
      </div>
    </form>
  )
}
