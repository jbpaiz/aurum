'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { AccountSelector } from '@/components/accounts/account-selector'
import { SimplePaymentMethodSelector } from '@/components/payment-methods/simple-payment-method-selector'
import { BankAccount } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  paymentMethod?: string
  accountId: string
  created_at: string
}

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void
  onClose: () => void
}

const categories = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Vendas',
    'Outros'
  ],
  expense: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Outros'
  ]
}

export function TransactionForm({ onSubmit, onClose }: TransactionFormProps) {
  const { updateAccountBalance } = useAccounts()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category || !date || !selectedAccountId) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const transactionAmount = parseFloat(amount)
    
    // Atualizar saldo da conta baseado no tipo de transação
    if (selectedAccount) {
      const operation = type === 'income' ? 'add' : 'subtract'
      await updateAccountBalance(selectedAccount.id, transactionAmount, operation)
    }

    onSubmit({
      type,
      amount: transactionAmount,
      description,
      category,
      date,
      paymentMethod,
      accountId: selectedAccountId
    })

    // Reset form
    setAmount('')
    setDescription('')
    setCategory('')
    setDate(new Date().toISOString().split('T')[0])
    setSelectedAccountId('')
    setSelectedAccount(null)
    setPaymentMethod('')
  }

  const handleAccountChange = (accountId: string, account: BankAccount) => {
    setSelectedAccountId(accountId)
    setSelectedAccount(account)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nova Transação</CardTitle>
              <CardDescription>
                Adicione uma nova receita ou despesa
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                onClick={() => {
                  setType('income')
                  setCategory('')
                }}
                className="w-full"
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => {
                  setType('expense')
                  setCategory('')
                }}
                className="w-full"
              >
                Despesa
              </Button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0,00"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Conta {type === 'income' ? 'que receberá' : 'que será debitada'}
              </label>
              <AccountSelector
                value={selectedAccountId}
                onChange={handleAccountChange}
                placeholder="Selecione a conta"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Como foi {type === 'income' ? 'recebido' : 'pago'}? (Opcional)
              </label>
              <SimplePaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="PIX, dinheiro, cartão..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
