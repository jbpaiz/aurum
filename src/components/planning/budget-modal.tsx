'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Tag, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Budget } from '@/hooks/use-budgets'

interface BudgetModalProps {
  budget?: Budget | null
  defaultMonth?: string
  onSave: (budget: Omit<Budget, 'id' | 'createdAt' | 'userId'>) => void
  onClose: () => void
}

const EXPENSE_CATEGORIES = [
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

export function BudgetModal({ budget, defaultMonth, onSave, onClose }: BudgetModalProps) {
  const [category, setCategory] = useState(budget?.category || '')
  const [description, setDescription] = useState(budget?.description || '')
  const [amount, setAmount] = useState(budget?.amount?.toString() || '')
  const [month, setMonth] = useState(budget?.month || defaultMonth || (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })())

  const isEditing = !!budget

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)

    if (!category.trim()) {
      alert('Selecione ou digite uma categoria')
      return
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Digite um valor válido para o orçamento')
      return
    }

    if (!month) {
      alert('Selecione o mês')
      return
    }

    onSave({
      category: category.trim(),
      description: description.trim(),
      amount: parsedAmount,
      month
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
            </CardTitle>
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
            {/* Mês */}
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="category"
                  type="text"
                  list="categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="pl-10"
                  placeholder="Selecione ou digite"
                  required
                />
                <datalist id="categories">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-10"
                  placeholder="Ex: Limite mensal para restaurantes"
                />
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Orçamento</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Salvar' : 'Criar Orçamento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
