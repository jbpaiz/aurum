'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCards } from '@/contexts/cards-context'
import { useAccounts } from '@/contexts/accounts-context'
import { AccountSelector } from '@/components/accounts/account-selector'
import { SimplePaymentMethodSelector } from '@/components/payment-methods/simple-payment-method-selector'
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
  Wallet,
  ArrowLeftRight
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  accountId: string // Mudança: usar conta diretamente
  paymentMethod?: string // Método de pagamento opcional (PIX, dinheiro, etc.)
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
  const { accounts, updateAccountBalance } = useAccounts()
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState(transaction?.accountId || '')
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || '')
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
      accountId,
      ...(paymentMethod && { paymentMethod }),
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

  const getTypeConfig = (transactionType: 'income' | 'expense') => {
    switch (transactionType) {
      case 'income':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'expense':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: DollarSign,
          color: 'text-primary',
          bgColor: 'bg-background',
          borderColor: 'border-border'
        }
    }
  }

  const typeConfig = getTypeConfig(type)
  const IconComponent = typeConfig.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md max-h-[90vh] overflow-y-auto ${typeConfig.borderColor} border-2`}>
        <CardHeader className={typeConfig.bgColor}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className={`h-5 w-5 ${typeConfig.color}`} />
              <div>
                <CardTitle className={typeConfig.color}>
                  {isEditing ? 'Editar Transação' : 'Nova Transação'}
                </CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Atualize os dados da transação'
                    : type === 'income' 
                      ? 'Adicione uma nova receita'
                      : 'Adicione uma nova despesa'
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
                  className={`gap-2 ${type === 'income' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'text-green-600 border-green-600 hover:bg-green-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setType('expense')}
                  className={`gap-2 ${type === 'expense' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'text-red-600 border-red-600 hover:bg-red-50'
                  }`}
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

            {/* Conta */}
            <div className="space-y-2">
              <Label>Conta</Label>
              <AccountSelector
                value={accountId}
                onChange={setAccountId}
                placeholder="Selecione a conta"
              />
              <p className="text-xs text-muted-foreground">
                Conta que será movimentada nesta transação
              </p>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <SimplePaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="Como foi pago?"
              />
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
                className={`flex-1 ${type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                } text-white`}
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
