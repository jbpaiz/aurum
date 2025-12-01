'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCards } from '@/contexts/cards-context'
import { useAccounts } from '@/contexts/accounts-context'
import { CreditCard } from '@/types/cards'

interface PayInvoiceModalProps {
  open: boolean
  onClose: () => void
  card: CreditCard
}

export function PayInvoiceModal({ open, onClose, card }: PayInvoiceModalProps) {
  const { payInvoice } = useCards()
  const { accounts } = useAccounts()
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount(card.currentBalance?.toFixed(2) || '0.00')
      setAccountId('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setError('')
    }
  }, [open, card])

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

    if (!accountId) {
      setError('Selecione uma conta para débito')
      return
    }

    if (!paymentDate) {
      setError('Selecione a data do pagamento')
      return
    }

    try {
      setIsSaving(true)
      await payInvoice(card.id, parsedAmount, accountId, paymentDate)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  const currentBalance = card.currentBalance || 0
  const availableLimit = (card.creditLimit || 0) - currentBalance

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Pagar Fatura</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Info do cartão */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-600">{card.alias}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fatura atual:</span>
              <span className="font-semibold text-red-600">{formatCurrency(currentBalance)}</span>
            </div>
            {card.creditLimit && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limite disponível:</span>
                <span className="font-semibold text-green-600">{formatCurrency(availableLimit)}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
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
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((currentBalance / 2).toFixed(2))}
              >
                Metade
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(currentBalance.toFixed(2))}
              >
                Total
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Conta para Débito</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
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
            <Label htmlFor="date">Data do Pagamento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
