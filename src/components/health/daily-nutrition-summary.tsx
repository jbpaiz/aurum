'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/contexts/health-context'
import { Utensils, Target, TrendingUp, TrendingDown } from 'lucide-react'

interface DailyNutritionSummaryProps {
  onGoalClick: () => void
  onAddMealClick: () => void
}

export function DailyNutritionSummary({ onGoalClick, onAddMealClick }: DailyNutritionSummaryProps) {
  const { nutritionStats } = useHealth()

  if (!nutritionStats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-500" />
              <CardTitle>Resumo Nutricional</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground space-y-4">
            <Utensils className="h-16 w-16 mx-auto opacity-50" />
            <div>
              <p className="font-medium mb-2">Configure suas metas nutricionais</p>
              <p className="text-sm mb-4">Defina metas diárias para acompanhar seu progresso</p>
              <Button onClick={onGoalClick}>
                <Target className="mr-2 h-4 w-4" />
                Definir Metas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { todayCalories, todayProtein, todayCarbs, todayFats, dailyGoals, caloriesProgress, mealsToday } = nutritionStats

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 80) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getProgressStatus = (current: number, goal?: number) => {
    if (!goal) return null
    const percent = (current / goal) * 100
    const diff = current - goal
    
    if (percent >= 100) {
      return { icon: TrendingUp, text: `+${Math.round(diff)}g acima`, color: 'text-green-600' }
    } else if (percent >= 80) {
      return { icon: TrendingUp, text: `${Math.round(Math.abs(diff))}g restante`, color: 'text-yellow-600' }
    } else {
      return { icon: TrendingDown, text: `${Math.round(Math.abs(diff))}g restante`, color: 'text-blue-600' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle>Resumo Nutricional</CardTitle>
              <p className="text-sm text-muted-foreground">{mealsToday} refeições hoje</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onGoalClick}>
              <Target className="mr-2 h-4 w-4" />
              Metas
            </Button>
            <Button size="sm" onClick={onAddMealClick}>
              <Utensils className="mr-2 h-4 w-4" />
              Registrar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calorias */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">Calorias</h4>
              <p className="text-sm text-muted-foreground">
                {Math.round(todayCalories)} / {dailyGoals?.dailyCalories || 0} kcal
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round(caloriesProgress)}%</p>
            </div>
          </div>
          <Progress value={caloriesProgress} className="h-3" />
          {dailyGoals?.dailyCalories && (
            <p className="text-xs text-muted-foreground">
              {caloriesProgress >= 100 
                ? `+${Math.round(todayCalories - dailyGoals.dailyCalories)} kcal acima da meta`
                : `${Math.round(dailyGoals.dailyCalories - todayCalories)} kcal restantes`
              }
            </p>
          )}
        </div>

        {/* Macronutrientes */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Macronutrientes</h4>

          {/* Proteínas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Proteínas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {Math.round(todayProtein)}g
                </span>
                {dailyGoals?.dailyProtein && (
                  <span className="text-xs text-muted-foreground">
                    / {dailyGoals.dailyProtein}g
                  </span>
                )}
              </div>
            </div>
            {dailyGoals?.dailyProtein && (
              <>
                <Progress 
                  value={Math.min(100, (todayProtein / dailyGoals.dailyProtein) * 100)} 
                  className="h-2"
                />
                {getProgressStatus(todayProtein, dailyGoals.dailyProtein) && (
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const status = getProgressStatus(todayProtein, dailyGoals.dailyProtein)!
                      const Icon = status.icon
                      return (
                        <>
                          <Icon className={`h-3 w-3 ${status.color}`} />
                          <span className={status.color}>{status.text}</span>
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Carboidratos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Carboidratos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {Math.round(todayCarbs)}g
                </span>
                {dailyGoals?.dailyCarbohydrates && (
                  <span className="text-xs text-muted-foreground">
                    / {dailyGoals.dailyCarbohydrates}g
                  </span>
                )}
              </div>
            </div>
            {dailyGoals?.dailyCarbohydrates && (
              <>
                <Progress 
                  value={Math.min(100, (todayCarbs / dailyGoals.dailyCarbohydrates) * 100)} 
                  className="h-2"
                />
                {getProgressStatus(todayCarbs, dailyGoals.dailyCarbohydrates) && (
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const status = getProgressStatus(todayCarbs, dailyGoals.dailyCarbohydrates)!
                      const Icon = status.icon
                      return (
                        <>
                          <Icon className={`h-3 w-3 ${status.color}`} />
                          <span className={status.color}>{status.text}</span>
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Gorduras */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">Gorduras</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {Math.round(todayFats)}g
                </span>
                {dailyGoals?.dailyFats && (
                  <span className="text-xs text-muted-foreground">
                    / {dailyGoals.dailyFats}g
                  </span>
                )}
              </div>
            </div>
            {dailyGoals?.dailyFats && (
              <>
                <Progress 
                  value={Math.min(100, (todayFats / dailyGoals.dailyFats) * 100)} 
                  className="h-2"
                />
                {getProgressStatus(todayFats, dailyGoals.dailyFats) && (
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const status = getProgressStatus(todayFats, dailyGoals.dailyFats)!
                      const Icon = status.icon
                      return (
                        <>
                          <Icon className={`h-3 w-3 ${status.color}`} />
                          <span className={status.color}>{status.text}</span>
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dica */}
        {!dailyGoals?.dailyCalories && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">💡 Dica</p>
            <p className="text-muted-foreground">
              Configure suas metas diárias para acompanhar melhor seu progresso nutricional
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onGoalClick}>
              Configurar Metas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
