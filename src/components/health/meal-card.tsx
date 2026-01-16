'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useHealth } from '@/contexts/health-context'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Utensils, Edit, Trash2, Plus, Target } from 'lucide-react'
import { toast } from 'sonner'
import type { Meal } from '@/types/health'

interface MealCardProps {
  detailed?: boolean
  onAddClick: () => void
  onEditClick: (meal: Meal) => void
  onGoalClick: () => void
}

const MEAL_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Café da Manhã', emoji: '🌅' },
  lunch: { label: 'Almoço', emoji: '🍽️' },
  dinner: { label: 'Jantar', emoji: '🌙' },
  snack: { label: 'Lanche', emoji: '🍎' }
}

export function MealCard({ detailed = false, onAddClick, onEditClick, onGoalClick }: MealCardProps) {
  const { meals, nutritionStats, deleteMeal } = useHealth()
  const [showAll, setShowAll] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayMeals = meals.filter(m => m.mealDate === today).sort((a, b) => 
    a.mealTime.localeCompare(b.mealTime)
  )

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

  const displayMeals = showAll ? todayMeals : todayMeals.slice(0, detailed ? 10 : 3)
  const hasMore = todayMeals.length > (detailed ? 10 : 3)

  const caloriesProgress = nutritionStats?.caloriesProgress || 0
  const dailyGoal = nutritionStats?.dailyGoals?.dailyCalories || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle>Alimentação</CardTitle>
              <CardDescription>Refeições de hoje</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onGoalClick}>
              <Target className="mr-2 h-4 w-4" />
              Meta
            </Button>
            <Button size="sm" onClick={onAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress de calorias */}
        {dailyGoal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Calorias</span>
              <span className="text-muted-foreground">
                {nutritionStats?.todayCalories || 0} / {dailyGoal} kcal
              </span>
            </div>
            <Progress value={caloriesProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(caloriesProgress)}% da meta diária
            </p>
          </div>
        )}

        {/* Stats de macros */}
        {nutritionStats && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Proteínas</p>
              <p className="text-lg font-semibold">{Math.round(nutritionStats.todayProtein)}g</p>
              {nutritionStats.dailyGoals?.dailyProtein && (
                <p className="text-xs text-muted-foreground">
                  de {nutritionStats.dailyGoals.dailyProtein}g
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Carboidratos</p>
              <p className="text-lg font-semibold">{Math.round(nutritionStats.todayCarbs)}g</p>
              {nutritionStats.dailyGoals?.dailyCarbohydrates && (
                <p className="text-xs text-muted-foreground">
                  de {nutritionStats.dailyGoals.dailyCarbohydrates}g
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Gorduras</p>
              <p className="text-lg font-semibold">{Math.round(nutritionStats.todayFats)}g</p>
              {nutritionStats.dailyGoals?.dailyFats && (
                <p className="text-xs text-muted-foreground">
                  de {nutritionStats.dailyGoals.dailyFats}g
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lista de refeições */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Refeições de hoje ({todayMeals.length})</h4>
          </div>

          {todayMeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma refeição registrada hoje</p>
              <Button size="sm" className="mt-3" onClick={onAddClick}>
                Registrar refeição
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayMeals.map((meal) => {
                  const mealInfo = MEAL_TYPE_LABELS[meal.mealType] || { label: meal.mealType, emoji: '🍽️' }
                  
                  return (
                    <div key={meal.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="text-2xl">{mealInfo.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{mealInfo.label}</p>
                            <p className="text-sm text-muted-foreground">{meal.mealTime} - {meal.description}</p>
                            {meal.calories !== null && meal.calories !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {meal.calories} kcal
                                {meal.protein && ` • ${meal.protein}g prot`}
                                {meal.carbohydrates && ` • ${meal.carbohydrates}g carb`}
                                {meal.fats && ` • ${meal.fats}g gord`}
                              </p>
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

              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Mostrar menos' : `Mostrar mais ${todayMeals.length - (detailed ? 10 : 3)} refeições`}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
