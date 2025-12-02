'use client'

import { useState, useEffect } from 'react'
import { Plus, Target, TrendingUp, Calendar, DollarSign, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { GoalModal } from './goal-modal'
import { useGoals, type Goal } from '@/hooks/use-goals'
import { useToast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/main-layout'

export function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  }

  const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData)
        toast({
          title: 'Meta atualizada!',
          description: 'As alterações foram salvas com sucesso.'
        })
      } else {
        await addGoal(goalData)
        toast({
          title: 'Meta criada!',
          description: 'Sua nova meta foi adicionada.'
        })
      }
      setIsModalOpen(false)
      setEditingGoal(null)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar a meta',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return

    try {
      await deleteGoal(id)
      toast({
        title: 'Meta excluída',
        description: 'A meta foi removida com sucesso.'
      })
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Não foi possível excluir a meta',
        variant: 'destructive'
      })
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrent = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 p-6 space-y-6 bg-gray-50">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando metas...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Metas Financeiras</h1>
            <p className="text-gray-600">Defina e acompanhe suas metas de economia</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Metas Ativas</CardTitle>
              <Target className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeGoals.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedGoals.length} já concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Economizado</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCurrent)}
              </div>
              <p className="text-xs text-muted-foreground">
                de {formatCurrency(totalTarget)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Progresso Geral</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {overallProgress.toFixed(1)}%
              </div>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metas Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(goal)
                const isCompleted = progress >= 100

                return (
                  <Card key={goal.id} className={isCompleted ? 'border-green-200 bg-green-50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          {goal.description && (
                            <CardDescription className="mt-1">{goal.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant={isCompleted ? 'default' : 'secondary'}>
                          {isCompleted ? 'Completa' : 'Em andamento'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progresso</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatCurrency(goal.currentAmount)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Prazo: {formatDate(goal.targetDate)}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Metas Concluídas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {goal.name}
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </CardTitle>
                    {goal.description && (
                      <CardDescription>{goal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Concluída em {formatDate(goal.targetDate)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-gray-500 mb-4">
                Comece definindo suas metas financeiras para acompanhar seu progresso
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Meta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Goal Modal */}
        {isModalOpen && (
          <GoalModal
            goal={editingGoal}
            onSave={handleSaveGoal}
            onClose={() => {
              setIsModalOpen(false)
              setEditingGoal(null)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}
