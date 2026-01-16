'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealth } from '@/contexts/health-context'
import { format, subDays, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { Meal } from '@/types/health'

interface MealHistoryProps {
  onEditClick: (meal: Meal) => void
}

type Period = 'week' | 'month' | 'all'

const MEAL_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Café da Manhã', emoji: '🌅' },
  lunch: { label: 'Almoço', emoji: '🍽️' },
  dinner: { label: 'Jantar', emoji: '🌙' },
  snack: { label: 'Lanche', emoji: '🍎' }
}

export function MealHistory({ onEditClick }: MealHistoryProps) {
  const { meals, deleteMeal } = useHealth()
  const [period, setPeriod] = useState<Period>('week')
  const [showCount, setShowCount] = useState(10)

  const handleDelete = async (meal: Meal) => {
    if (!window.confirm(`Remover refeição "${meal.description}"?`)) return

    try {
      await deleteMeal(meal.id)
      toast.success('Refeição removida!')
    } catch (error) {
      console.error('Erro ao remover refeição:', error)
      toast.error('Erro ao remover refeição')
    }
  }

  // Filtrar por período
  const now = new Date()
  const filteredMeals = meals.filter(meal => {
    const mealDateTime = new Date(`${meal.mealDate}T${meal.mealTime}`)
    
    switch (period) {
      case 'week':
        return isAfter(mealDateTime, subDays(now, 7))
      case 'month':
        return isAfter(mealDateTime, subDays(now, 30))
      case 'all':
      default:
        return true
    }
  }).sort((a, b) => {
    const dateA = new Date(`${a.mealDate}T${a.mealTime}`)
    const dateB = new Date(`${b.mealDate}T${b.mealTime}`)
    return dateB.getTime() - dateA.getTime()
  })

  // Agrupar por data
  const groupedMeals: Record<string, Meal[]> = {}
  filteredMeals.forEach(meal => {
    if (!groupedMeals[meal.mealDate]) {
      groupedMeals[meal.mealDate] = []
    }
    groupedMeals[meal.mealDate].push(meal)
  })

  const dates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a))
  const displayDates = dates.slice(0, showCount)
  const hasMore = dates.length > showCount

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <CardTitle>Histórico de Refeições</CardTitle>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredMeals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma refeição encontrada neste período
          </div>
        ) : (
          <div className="space-y-6">
            {displayDates.map(date => {
              const mealsOnDate = groupedMeals[date]
              const totalCalories = mealsOnDate.reduce((sum, m) => sum + (m.calories || 0), 0)
              const totalProtein = mealsOnDate.reduce((sum, m) => sum + (m.protein || 0), 0)
              
              return (
                <div key={date} className="space-y-2">
                  {/* Data e totais */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <h4 className="font-semibold">
                        {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {mealsOnDate.length} refeições
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{Math.round(totalCalories)} kcal</p>
                      <p className="text-xs text-muted-foreground">{Math.round(totalProtein)}g prot</p>
                    </div>
                  </div>

                  {/* Lista de refeições */}
                  <div className="space-y-2">
                    {mealsOnDate.map(meal => {
                      const mealInfo = MEAL_TYPE_LABELS[meal.mealType] || { label: meal.mealType, emoji: '🍽️' }
                      
                      return (
                        <div key={meal.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="text-2xl">{mealInfo.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{mealInfo.label}</p>
                                  <span className="text-xs text-muted-foreground">{meal.mealTime}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                                {(meal.calories !== null && meal.calories !== undefined) && (
                                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>{meal.calories} kcal</span>
                                    {meal.protein && <span>P: {meal.protein}g</span>}
                                    {meal.carbohydrates && <span>C: {meal.carbohydrates}g</span>}
                                    {meal.fats && <span>G: {meal.fats}g</span>}
                                  </div>
                                )}
                                {meal.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">{meal.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEditClick(meal)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(meal)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCount(prev => prev + 10)}
              >
                Carregar mais
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
