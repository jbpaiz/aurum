'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, DollarSign, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCards } from '@/contexts/cards-context'
import { CreditCard as CreditCardType } from '@/types/cards'

interface EditCardLimitModalProps {
  open: boolean
  onClose: () => void
  card: CreditCardType
}

export function EditCardLimitModal({ open, onClose, card }: EditCardLimitModalProps) {
  const { updateCard } = useCards()
  const [creditLimit, setCreditLimit] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCreditLimit(card.creditLimit?.toString() || '')
      setCurrentBalance(card.currentBalance?.toString() || '0')
      setDueDay(card.dueDay?.toString() || '')
      setClosingDay(card.closingDay?.toString() || '')
      setError('')
    }
  }, [open, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const limit = creditLimit ? parseFloat(creditLimit) : undefined
    const balance = currentBalance ? parseFloat(currentBalance) : 0
    const due = dueDay ? parseInt(dueDay) : undefined
    const closing = closingDay ? parseInt(closingDay) : undefined

    if (limit !== undefined && (isNaN(limit) || limit < 0)) {
      setError('Informe um limite válido')
      return
    }

    if (isNaN(balance)) {
      setError('Informe um saldo válido')
      return
    }

    if (due !== undefined && (due < 1 || due > 31)) {
      setError('Dia de vencimento deve estar entre 1 e 31')
      return
    }

    if (closing !== undefined && (closing < 1 || closing > 31)) {
      setError('Dia de fechamento deve estar entre 1 e 31')
      return
    }

    try {
      setIsSaving(true)
      await updateCard(card.id, {
        creditLimit: limit,
        currentBalance: balance,
        dueDay: due,
        closingDay: closing
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cartão')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Editar Cartão</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-900">{card.alias}</p>
          <p className="text-xs text-gray-500">
            {card.type === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {card.type === 'credit' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de Crédito</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentBalance">Fatura Atual</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Valor atual da fatura (positivo = deve)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="closingDay">Dia Fechamento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="closingDay"
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="pl-10"
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDay">Dia Vencimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="pl-10"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {card.type === 'debit' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              Cartões de débito não possuem limite ou fatura.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
