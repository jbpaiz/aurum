'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ArrowRightLeft } from 'lucide-react'
import { AccountSelector } from '@/components/accounts/account-selector'
import { SimplePaymentMethodSelector } from '@/components/payment-methods/simple-payment-method-selector'
import { BankAccount } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (transfer: any) => void
}

export function TransferModal({ isOpen, onClose, onSubmit }: TransferModalProps) {
  const { updateAccountBalance } = useAccounts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [fromAccount, setFromAccount] = useState<BankAccount | null>(null)
  const [toAccount, setToAccount] = useState<BankAccount | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount || !formData.paymentMethod) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const transferAmount = parseFloat(formData.amount)

    if (transferAmount <= 0) {
      alert('O valor da transferência deve ser maior que zero')
      return
    }

    if (fromAccount && fromAccount.balance < transferAmount) {
      alert('Saldo insuficiente na conta de origem')
      return
    }

    setLoading(true)

    try {
      // Debitar da conta de origem
      await updateAccountBalance(formData.fromAccountId, transferAmount, 'subtract')
      
      // Creditar na conta de destino
      await updateAccountBalance(formData.toAccountId, transferAmount, 'add')

      // Criar registro da transferência
      const transfer = {
        id: `transfer_${Date.now()}`,
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: transferAmount,
        description: formData.description || `Transferência ${fromAccount?.name} → ${toAccount?.name}`,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        createdAt: new Date().toISOString()
      }

      onSubmit(transfer)
      onClose()

      // Reset form
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0]
      })
      setFromAccount(null)
      setToAccount(null)
    } catch (error) {
      console.error('Erro ao realizar transferência:', error)
      alert('Erro ao realizar transferência. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleFromAccountChange = (accountId: string, account: BankAccount) => {
    setFormData({ ...formData, fromAccountId: accountId })
    setFromAccount(account)
  }

  const handleToAccountChange = (accountId: string, account: BankAccount) => {
    setFormData({ ...formData, toAccountId: accountId })
    setToAccount(account)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-blue-200 border-2">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-600">Transferência entre Contas</CardTitle>
                <CardDescription>
                  Transfira dinheiro entre suas contas
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Conta de Origem */}
            <div className="space-y-2">
              <Label>Conta de Origem</Label>
              <AccountSelector
                value={formData.fromAccountId}
                onChange={handleFromAccountChange}
                placeholder="De qual conta?"
              />
              {fromAccount && (
                <p className="text-xs text-gray-500">
                  Saldo disponível: {formatCurrency(fromAccount.balance)}
                </p>
              )}
            </div>

            {/* Conta de Destino */}
            <div className="space-y-2">
              <Label>Conta de Destino</Label>
              <AccountSelector
                value={formData.toAccountId}
                onChange={handleToAccountChange}
                placeholder="Para qual conta?"
                excludeAccountId={formData.fromAccountId}
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
              />
              {fromAccount && formData.amount && parseFloat(formData.amount) > fromAccount.balance && (
                <p className="text-xs text-red-600">
                  Valor maior que o saldo disponível
                </p>
              )}
            </div>

            {/* Método de Transferência */}
            <div className="space-y-2">
              <Label>Como foi feita a transferência?</Label>
              <SimplePaymentMethodSelector
                value={formData.paymentMethod}
                onChange={(method) => setFormData({ ...formData, paymentMethod: method })}
                placeholder="PIX, TED, saque..."
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento de conta, reserva de emergência..."
              />
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Preview da Transferência */}
            {fromAccount && toAccount && formData.amount && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Resumo da Transferência:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1">{fromAccount.name}</span>
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    <span className="flex-1 text-right">{toAccount.name}</span>
                  </div>
                  <div className="text-center font-bold text-blue-600 mt-2">
                    {formatCurrency(parseFloat(formData.amount))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={loading || !formData.fromAccountId || !formData.toAccountId || !formData.amount || !formData.paymentMethod}
              >
                {loading ? 'Transferindo...' : 'Transferir'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
