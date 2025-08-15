'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  ArrowLeftRight
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  description: string
  amount: number
  category?: string
  date: string
  accountId?: string // Para income e expense
  fromAccountId?: string // Para transfer
  toAccountId?: string // Para transfer
  paymentMethod?: string
  installments?: number
}

interface UnifiedTransactionModalProps {
  isOpen?: boolean
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
    'Dividendos',
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
    'Impostos',
    'Seguros',
    'Outros'
  ]
}

const PAYMENT_METHODS_WITH_INSTALLMENTS = [
  'Cartão de Crédito',
  'Crediário',
  'Financiamento'
]

export function UnifiedTransactionModal({ isOpen = true, transaction, onSave, onClose }: UnifiedTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction?.type || 'expense')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState(transaction?.accountId || '')
  const [fromAccountId, setFromAccountId] = useState(transaction?.fromAccountId || '')
  const [toAccountId, setToAccountId] = useState(transaction?.toAccountId || '')
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || '')
  const [installments, setInstallments] = useState(transaction?.installments?.toString() || '1')

  const isEditing = !!transaction

  // Reset fields when type changes
  useEffect(() => {
    if (!isEditing) {
      setCategory('')
      setAccountId('')
      setFromAccountId('')
      setToAccountId('')
      setPaymentMethod('')
      setInstallments('1')
    }
  }, [type, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const baseData = {
      type,
      description: description.trim(),
      amount: parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.')),
      date,
      ...(paymentMethod && { paymentMethod })
    }

    let transactionData

    if (type === 'transfer') {
      transactionData = {
        ...baseData,
        fromAccountId,
        toAccountId
      }
    } else {
      transactionData = {
        ...baseData,
        category,
        accountId,
        ...(shouldShowInstallments() && parseInt(installments) > 1 && { 
          installments: parseInt(installments) 
        })
      }
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
    // Remove caracteres não numéricos exceto vírgula e ponto
    const numericValue = value.replace(/[^\d.,]/g, '')
    
    // Se tiver vírgula, trata como separador decimal brasileiro
    if (numericValue.includes(',')) {
      const parts = numericValue.split(',')
      if (parts.length === 2) {
        // Remove pontos da parte inteira e limita decimais a 2 dígitos
        const integerPart = parts[0].replace(/\./g, '')
        const decimalPart = parts[1].substring(0, 2)
        
        // Formata a parte inteira com separadores de milhares
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        return `R$ ${formattedInteger},${decimalPart}`
      }
    }
    
    // Se só tem números, formata como valor inteiro
    const cleanValue = numericValue.replace(/\./g, '')
    if (cleanValue) {
      const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `R$ ${formattedValue}`
    }
    
    return value
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(formatCurrency(value))
  }

  const shouldShowInstallments = () => {
    return type === 'expense' && PAYMENT_METHODS_WITH_INSTALLMENTS.includes(paymentMethod)
  }

  const getTypeConfig = (transactionType: 'income' | 'expense' | 'transfer') => {
    switch (transactionType) {
      case 'income':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonClass: 'bg-green-600 hover:bg-green-700'
        }
      case 'expense':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonClass: 'bg-red-600 hover:bg-red-700'
        }
      case 'transfer':
        return {
          icon: ArrowLeftRight,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonClass: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const typeConfig = getTypeConfig(type)
  const IconComponent = typeConfig.icon

  if (!isOpen) return null

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
                      : type === 'expense'
                        ? 'Adicione uma nova despesa'
                        : 'Faça uma transferência entre contas'
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
              <div className="grid grid-cols-3 gap-2">
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
                <Button
                  type="button"
                  variant={type === 'transfer' ? 'default' : 'outline'}
                  onClick={() => setType('transfer')}
                  className={`gap-2 ${type === 'transfer' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'text-blue-600 border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Transfer
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
                  placeholder={type === 'transfer' 
                    ? "Ex: Transferência para poupança" 
                    : "Ex: Supermercado, Salário, etc."
                  }
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
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Campos específicos por tipo */}
            {type === 'transfer' ? (
              // Campos para Transferência
              <>
                <div className="space-y-2">
                  <Label>Conta de Origem</Label>
                  <AccountSelector
                    value={fromAccountId}
                    onChange={(accountId) => setFromAccountId(accountId)}
                    placeholder="De qual conta?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conta de Destino</Label>
                  <AccountSelector
                    value={toAccountId}
                    onChange={(accountId) => setToAccountId(accountId)}
                    placeholder="Para qual conta?"
                    excludeAccountId={fromAccountId}
                  />
                </div>
              </>
            ) : (
              // Campos para Receita/Despesa
              <>
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

                <div className="space-y-2">
                  <Label>Conta</Label>
                  <AccountSelector
                    value={accountId}
                    onChange={(accountId) => setAccountId(accountId)}
                    placeholder="Selecione a conta"
                  />
                </div>
              </>
            )}

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
              <SimplePaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder={type === 'transfer' 
                  ? "Como foi feita a transferência?" 
                  : "Como foi pago/recebido?"
                }
              />
            </div>

            {/* Parcelas (apenas para despesas com cartão de crédito) */}
            {shouldShowInstallments() && (
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
                <p className="text-xs text-muted-foreground">
                  Disponível apenas para pagamentos parcelados
                </p>
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
                className={`flex-1 ${typeConfig.buttonClass} text-white`}
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
