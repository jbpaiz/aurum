'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar,
  DollarSign,
  Tag,
  X,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCards } from '@/contexts/cards-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  paymentMethod?: 'credit' | 'debit' | 'pix' | 'cash'
  cardId?: string
  installments?: number
}

interface TransactionModalProps {
  transaction?: Transaction | null
  onSave: (transaction: Transaction | Omit<Transaction, 'id'>) => void
  onClose: () => void
}

const incomeCategories = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Outros'
]

const expenseCategories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Outros'
]

export function TransactionModal({ transaction, onSave, onClose }: TransactionModalProps) {
  const { cards, getProviderById } = useCards()
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense' as 'income' | 'expense',
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    date: transaction?.date || format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: transaction?.paymentMethod || '' as 'credit' | 'debit' | 'pix' | 'cash' | '',
    cardId: transaction?.cardId || '',
    installments: transaction?.installments?.toString() || '1'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero'
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória'
    }

    if (formData.type === 'expense' && !formData.paymentMethod) {
      newErrors.paymentMethod = 'Forma de pagamento é obrigatória'
    }

    if ((formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit') && !formData.cardId) {
      newErrors.cardId = 'Selecione um cartão'
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        installments: parseInt(formData.installments) || 1,
        paymentMethod: formData.paymentMethod || undefined,
      }

      if (transaction) {
        onSave({
          ...transactionData,
          id: transaction.id
        })
      } else {
        onSave(transactionData)
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '', // Reset category when type changes
      cardId: '', // Reset card when type changes
    }))
    setErrors(prev => ({ ...prev, category: '', cardId: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {transaction ? 'Editar Transação' : 'Nova Transação'}
              </CardTitle>
              <CardDescription>
                {transaction ? 'Atualize os dados da transação' : 'Adicione uma nova movimentação financeira'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('income')}
                  className="justify-center"
                >
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('expense')}
                  className="justify-center"
                >
                  Despesa
                </Button>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descreva a transação"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData(prev => ({ 
                  ...prev, 
                  category: value,
                  cardId: value !== 'Cartão de Crédito' ? '' : prev.cardId // Reset card if not credit card
                }))}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Seleção de Cartão - apenas se categoria for "Cartão de Crédito" */}
            {formData.category === 'Cartão de Crédito' && (
              <div className="space-y-2">
                <Label>Cartão</Label>
                {cards.length === 0 ? (
                  <div className="p-3 border border-dashed rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhum cartão cadastrado
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Aqui você pode abrir o modal de adicionar cartão
                        // ou redirecionar para a página de cartões
                      }}
                    >
                      Cadastrar Cartão
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select
                      value={formData.cardId}
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, cardId: value }))}
                    >
                      <SelectTrigger className={errors.cardId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione um cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map((card) => {
                          const provider = getProviderById(card.providerId)
                          return (
                            <SelectItem key={card.id} value={card.id}>
                              <div className="flex items-center gap-2">
                                <span>{provider?.icon}</span>
                                <span>{card.alias}</span>
                                {card.lastFourDigits && (
                                  <span className="text-muted-foreground text-xs">
                                    ••••{card.lastFourDigits}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {errors.cardId && (
                      <p className="text-sm text-red-500">{errors.cardId}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Parcelas - apenas se cartão for selecionado */}
            {formData.category === 'Cartão de Crédito' && formData.cardId && (
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Select
                  value={formData.installments}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, installments: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Número de parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x {num === 1 ? '(à vista)' : `de ${(parseFloat(formData.amount) / num).toFixed(2).replace('.', ',')}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {parseInt(formData.installments) > 1 && formData.amount && 
                    `Total: ${formatCurrency(parseFloat(formData.amount))}`
                  }
                </p>
              </div>
            )}

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`pl-10 ${errors.date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Canc