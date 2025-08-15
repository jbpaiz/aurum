'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCards } from '@/contexts/cards-context'
import { useAccounts } from '@/contexts/accounts-context'
import { 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  X,
  CreditCard,
  Hash,
  Wallet
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  paymentMethodId?: string // Mudança: usar método de pagamento ao invés de cardId
  installments?: number
}

interface TransactionModalProps {
  transaction?: Transaction | null
  onSave: (transaction: Transaction | Omit<Transaction, 'id'>) => void
  onClose: () => void
}

const CATEGORIES = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Aluguel',
    'Vendas',
    'Prêmios',
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
    'Serviços',
    'Investimentos',
    'Outros'
  ]
}

export function TransactionModal({ transaction, onSave, onClose }: TransactionModalProps) {
  const { cards, getProviderById } = useCards()
  const { paymentMethods, getAccountById } = useAccounts()
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId || 'none')
  const [installments, setInstallments] = useState(transaction?.installments?.toString() || '1')

  const isEditing = !!transaction

  // Reset category when type changes
  useEffect(() => {
    if (!isEditing) {
      setCategory('')
    }
  }, [type, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transactionData = {
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      ...(paymentMethodId && paymentMethodId !== 'none' && { paymentMethodId }),
      ...(type === 'expense' && parseInt(installments) > 1 && { installments: parseInt(installments) })
    }

    if (isEditing) {
      onSave({
        ...transactionData,
        id: transaction.id
      })
    } else {
      onSave(transactionData)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.,]/g, '')
    return numericValue
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(formatCurrency(value))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>
                  {isEditing ? 'Editar Transação' : 'Nova Transação'}
                </CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Atualize os dados da transação'
                    : 'Adicione uma nova movimentação financeira'
                  }
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Transação */}
            <div className="space-y-2">
              <Label>Tipo de Transação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'income' ? 'default' : 'outline'}
                  onClick={() => setType('income')}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setType('expense')}
                  className="gap-2"
                >
                  <TrendingDown className="h-4 w-4" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  type="text"
                  placeholder="Ex: Supermercado, Salário, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione uma categoria" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[type].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  {paymentMethods.map((method) => {
                    const account = getAccountById(method.accountId)
                    return (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          <span>{method.icon}</span>
                          <span>{method.name}</span>
                          {account && (
                            <span className="text-xs text-muted-foreground">
                              ({account.name})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A forma de pagamento afetará o saldo da conta correspondente
              </p>
            </div>

            {/* Parcelas (apenas para despesas) */}
            {type === 'expense' && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select value={installments} onValueChange={setInstallments}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x {num === 1 ? '(À vista)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {isEditing ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
