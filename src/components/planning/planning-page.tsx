'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Calendar, TrendingDown, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BudgetModal } from './budget-modal'
import { useBudgets, type Budget } from '@/hooks/use-budgets'
import { useTransactions } from '@/hooks/use-transactions'
import { useToast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/main-layout'

export function PlanningPage() {
  const { budgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget } = useBudgets()
  const { transactions, loading: transactionsLoading } = useTransactions()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const monthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth)
  }, [budgets, selectedMonth])

  const monthExpenses = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'expense') return false
      const txMonth = t.date.substring(0, 7)
      return txMonth === selectedMonth
    })
  }, [transactions, selectedMonth])

  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {}
    monthExpenses.forEach(tx => {
      const category = tx.category || 'Sem categoria'
      spending[category] = (spending[category] || 0) + tx.amount
    })
    return spending
  }, [monthExpenses])

  const budgetAnalysis = useMemo(() => {
    return monthBudgets.map(budget => {
      const spent = categorySpending[budget.category] || 0
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
      
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentage,
        status
      }
    })
  }, [monthBudgets, categorySpending])

  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgetAnalysis.reduce((sum, b) => sum + b.spent, 0)
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const exceededCount = budgetAnalysis.filter(b => b.status === 'exceeded').length
  const warningCount = budgetAnalysis.filter(b => b.status === 'warning').length

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'userId'>) => {
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData)
        toast({
          title: 'Orçamento atualizado!',
          description: 'As alterações foram salvas com sucesso.'
        })
      } else {
        await addBudget(budgetData)
        toast({
          title: 'Orçamento criado!',
          description: 'O orçamento foi adicionado com sucesso.'
        })
      }
      setIsModalOpen(false)
      setEditingBudget(null)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar o orçamento',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return

    try {
      await deleteBudget(id)
      toast({
        title: 'Orçamento excluído',
        description: 'O orçamento foi removido com sucesso.'
      })
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Não foi possível excluir o orçamento',
        variant: 'destructive'
      })
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setIsModalOpen(true)
  }

  const loading = budgetsLoading || transactionsLoading

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 p-6 space-y-6 bg-gray-50">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando planejamento...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planejamento e Orçamento</h1>
            <p className="text-gray-600">Controle seus gastos mensais por categoria</p>
          </div>
          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Orçamento Total</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalBudget)}
              </div>
              <p className="text-xs text-muted-foreground">
                {monthBudgets.length} categorias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gasto</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalPercentage.toFixed(1)}% do orçamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Disponível</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBudget - totalSpent)}
              </div>
              <Progress value={Math.min(totalPercentage, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertas</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {exceededCount + warningCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {exceededCount} excedidos, {warningCount} em alerta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget List */}
        {budgetAnalysis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgetAnalysis.map((budget) => (
              <Card key={budget.id} className={
                budget.status === 'exceeded' ? 'border-red-200 bg-red-50/50' :
                budget.status === 'warning' ? 'border-orange-200 bg-orange-50/50' : ''
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {budget.category}
                        {budget.status === 'exceeded' && (
                          <Badge variant="destructive">Excedido</Badge>
                        )}
                        {budget.status === 'warning' && (
                          <Badge className="bg-orange-500">Atenção</Badge>
                        )}
                        {budget.status === 'ok' && (
                          <Badge variant="secondary">OK</Badge>
                        )}
                      </CardTitle>
                      {budget.description && (
                        <CardDescription className="mt-1">{budget.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Gasto</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {budget.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className={
                        budget.status === 'exceeded' ? 'bg-red-200' :
                        budget.status === 'warning' ? 'bg-orange-200' : ''
                      }
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatCurrency(budget.spent)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(budget.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Restante</p>
                      <p className={`text-lg font-bold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(budget.remaining))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBudget(budget)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum orçamento definido
              </h3>
              <p className="text-gray-500 mb-4">
                Comece criando orçamentos para as categorias de despesas do mês selecionado
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Budget Modal */}
        {isModalOpen && (
          <BudgetModal
            budget={editingBudget}
            defaultMonth={selectedMonth}
            onSave={handleSaveBudget}
            onClose={() => {
              setIsModalOpen(false)
              setEditingBudget(null)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}
