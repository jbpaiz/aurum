'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccountSelector } from '@/components/accounts/account-selector'
import { SimplePaymentMethodSelector } from '@/components/payment-methods/simple-payment-method-selector'
import { CardSelector } from '@/components/cards/card-selector'
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

export interface TransactionFormValues {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  accountId?: string
  paymentMethod?: string // Método de pagamento opcional (PIX, dinheiro, etc.)
  cardId?: string // ID do cartão de crédito (quando paymentMethod === 'credit_card')
  installments?: number
}

interface TransactionModalProps {
  transaction?: TransactionFormValues | null
  onSave: (transaction: TransactionFormValues | Omit<TransactionFormValues, 'id'>) => Promise<void> | void
  onClose: () => void
  isSaving?: boolean
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

export function TransactionModal({ transaction, onSave, onClose, isSaving = false }: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense')
  const [description, setDescription] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState(transaction?.accountId || '')
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || '')
  const [cardId, setCardId] = useState(transaction?.cardId || '')
  const [installments, setInstallments] = useState(transaction?.installments?.toString() || '1')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)

  const isEditing = !!transaction

  // Reset category when type changes
  useEffect(() => {
    if (!isEditing) {
      setCategory('')
    }
  }, [type, isEditing])

  // Reset cardId quando mudar forma de pagamento
  useEffect(() => {
    if (paymentMethod !== 'credit_card') {
      setCardId('')
    }
  }, [paymentMethod])

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return NaN
    const normalized = value
      .replace(/[R$]/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    return parseFloat(normalized)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAmountError(null)
    setAccountError(null)

    const numericAmount = parseCurrencyToNumber(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setAmountError('Informe um valor válido maior que zero')
      return
    }

    // Conta é obrigatória EXCETO quando for compra no cartão de crédito
    const isCreditCardPurchase = type === 'expense' && paymentMethod === 'credit_card' && cardId
    
    if (!isCreditCardPurchase && !accountId) {
      setAccountError('Selecione a conta relacionada à transação')
      return
    }

    // Se for cartão de crédito, validar se tem cartão selecionado
    if (type === 'expense' && paymentMethod === 'credit_card' && !cardId) {
      setAccountError('Selecione o cartão de crédito')
      return
    }

    const trimmedDescription = description.trim()
    const installmentsNumber = type === 'expense' ? parseInt(installments) || 1 : 1

    const transactionData = {
      type,
      description: trimmedDescription,
      amount: Number(numericAmount.toFixed(2)),
      category,
      date,
      ...(accountId && { accountId }), // Só adiciona se tiver
      ...(paymentMethod && { paymentMethod }),
      ...(paymentMethod === 'credit_card' && cardId && { cardId }),
      ...(type === 'expense' && installmentsNumber > 1 && { installments: installmentsNumber })
    }

    if (isEditing && transaction) {
      await Promise.resolve(onSave({ ...transactionData, id: transaction.id }))
    } else {
      await Promise.resolve(onSave(transactionData))
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
    if (amountError) {
      setAmountError(null)
    }
  }

  const handleAccountChange = (selectedAccountId: string) => {
    setAccountId(selectedAccountId)
    if (accountError) {
      setAccountError(null)
    }
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className={`w-full max-w-4xl my-8 ${typeConfig.borderColor} dark:border-gray-700 border-2 dark:bg-gray-800`}>
        <CardHeader className={`${typeConfig.bgColor} dark:bg-gray-900/50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className={`h-5 w-5 ${typeConfig.color}`} />
              <div>
                <CardTitle className={`${typeConfig.color} dark:text-white`}>
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

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    : 'text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:border-green-500'
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
                    : 'text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-500'
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Grid de campos - 2 colunas em telas grandes */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
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
                  {amountError && (
                    <p className="text-xs text-red-500">{amountError}</p>
                  )}
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
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4">
                {/* Método de Pagamento */}
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <SimplePaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Como foi pago?"
                    disabled={isSaving}
                  />
                </div>

                {/* Conta - Ocultar quando for cartão de crédito */}
                {!(type === 'expense' && paymentMethod === 'credit_card') && (
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <AccountSelector
                      value={accountId}
                      onChange={(id) => handleAccountChange(id)}
                      disabled={isSaving}
                      placeholder="Selecione a conta"
                    />
                    <p className="text-xs text-muted-foreground">
                      Conta que será movimentada nesta transação
                    </p>
                    {accountError && (
                      <p className="text-xs text-red-500">{accountError}</p>
                    )}
                  </div>
                )}

                {/* Seletor de Cartão (apenas se for cartão de crédito) */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label>Cartão de Crédito</Label>
                    <CardSelector
                      value={cardId}
                      onChange={setCardId}
                      placeholder="Selecione o cartão"
                      disabled={isSaving}
                    />
                  </div>
                )}

                {/* Parcelas (apenas para despesas) */}
                {type === 'expense' && (
                  <div className="space-y-2">
                    <Label htmlFor="installments">Parcelas</Label>
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
              </div>
            </div>

            {/* Alerta de Cartão de Crédito (largura total) */}
            {paymentMethod === 'credit_card' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Compra no Cartão de Crédito</p>
                    <p className="mt-1">
                      Esta compra será lançada na fatura do cartão e NÃO será debitada imediatamente da sua conta.
                      {parseInt(installments) > 1 && ` A compra será parcelada em ${installments}x nas próximas faturas.`}
                    </p>
                  </div>
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
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
