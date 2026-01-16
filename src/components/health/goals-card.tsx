'use client'

import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, TrendingDown, Activity, Moon } from 'lucide-react'

interface GoalsCardProps {
  onAddClick?: () => void
}

export function GoalsCard({ onAddClick }: GoalsCardProps) {
  const { goals, weightStats, activityStats } = useHealth()

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'weight': return <TrendingDown className="h-4 w-4" />
      case 'activity': return <Activity className="h-4 w-4" />
      case 'sleep': return <Moon className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getGoalLabel = (type: string) => {
    switch (type) {
      case 'weight': return 'Peso'
      case 'activity': return 'Atividade'
      case 'sleep': return 'Sono'
      default: return 'Meta'
    }
  }

  const getGoalProgress = (goal: typeof goals[0]) => {
    if (goal.goalType === 'weight' && weightStats) {
      const current = weightStats.current || 0
      const target = goal.targetValue
      const start = weightStats.max || 0 // Assuming max is the starting weight
      const progress = start !== target ? ((start - current) / (start - target)) * 100 : 0
      return Math.min(Math.max(progress, 0), 100)
    }
    
    if (goal.goalType === 'activity' && activityStats) {
      return activityStats.weeklyProgress
    }
    
    return 0
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Metas</span>
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </CardTitle>
          <CardDescription>Configure suas metas de saúde</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Metas</span>
          {onAddClick && (
            <Button size="sm" variant="outline" onClick={onAddClick}>
              Adicionar
            </Button>
          )}
        </CardTitle>
        <CardDescription>Acompanhe seu progresso</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {goals.map(goal => {
            const progress = getGoalProgress(goal)
            return (
              <div key={goal.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getGoalIcon(goal.goalType)}
                    <span className="font-medium">{getGoalLabel(goal.goalType)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.targetValue} {goal.goalType === 'weight' ? 'kg' : goal.goalType === 'activity' ? 'min/semana' : 'h'}
                  </span>
                </div>
                {progress > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progress.toFixed(0)}% completo
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
