'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightLeft, DollarSign, Calendar, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAccounts } from '@/contexts/accounts-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TransferModal({ open, onClose, onSuccess }: TransferModalProps) {
  const { user } = useAuth()
  const { accounts, refresh } = useAccounts()
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setFromAccountId('')
      setToAccountId('')
      setAmount('')
      setDescription('')
      setTransferDate(new Date().toISOString().split('T')[0])
      setError('')
    }
  }, [open])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido')
      return
    }

    if (!fromAccountId) {
      setError('Selecione a conta de origem')
      return
    }

    if (!toAccountId) {
      setError('Selecione a conta de destino')
      return
    }

    if (fromAccountId === toAccountId) {
      setError('As contas de origem e destino devem ser diferentes')
      return
    }

    if (!transferDate) {
      setError('Selecione a data da transferência')
      return
    }

    if (!user) {
      setError('Usuário não autenticado')
      return
    }

    try {
      setIsSaving(true)

      // Validar que as contas existem
      const fromAccountExists = accounts.find(a => a.id === fromAccountId)
      const toAccountExists = accounts.find(a => a.id === toAccountId)

      if (!fromAccountExists || !toAccountExists) {
        throw new Error('Conta não encontrada')
      }

      console.log('Iniciando transferência:', {
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        date: transferDate
      })

      // Criar transação de transferência usando o tipo 'transfer'
      // Importante: account_id deve ser NULL, e from/to devem estar preenchidos
      const transferData = {
        user_id: user.id,
        type: 'transfer',
        description: description || `Transferência: ${fromAccountExists.name} → ${toAccountExists.name}`,
        amount: parsedAmount,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        account_id: null, // Explicitamente NULL para transferências
        category_id: null,
        payment_method_id: null,
        transaction_date: transferDate,
        notes: description || null,
        is_confirmed: true
      }

      console.log('Criando transação de transferência:', transferData)

      const { data: transferResult, error: transferError } = await supabase
        .from('transactions')
        .insert(transferData)
        .select()
        .single()

      if (transferError) {
        console.error('Erro ao criar transferência:', transferError)
        throw new Error(`Erro na transferência: ${transferError.message}`)
      }

      console.log('Transferência criada:', transferResult)

      await refresh()
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err instanceof Error ? err.message : 'Erro ao processar transferência')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  const fromAccount = accounts.find(a => a.id === fromAccountId)
  const toAccount = accounts.find(a => a.id === toAccountId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Transferência Entre Contas</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fromAccount">De (Origem)</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{account.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-xs text-gray-500">
                Saldo disponível: {formatCurrency(fromAccount.balance)}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">Para (Destino)</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter(a => a.id !== fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{account.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10 min-h-[60px]"
                placeholder="Ex: Ajuste de saldo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
