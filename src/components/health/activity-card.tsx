'use client'

import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from '@/types/health'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityCardProps {
  detailed?: boolean
  onAddClick?: () => void
}

export function ActivityCard({ detailed = false, onAddClick }: ActivityCardProps) {
  const { activities, activityStats } = useHealth()

  const recentActivities = useMemo(() => {
    return activities.slice(0, detailed ? 20 : 5)
  }, [activities, detailed])

  if (!activityStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Atividades</span>
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </CardTitle>
          <CardDescription>Nenhuma atividade registrada</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Atividades</span>
          {onAddClick && (
            <Button size="sm" variant="outline" onClick={onAddClick}>
              Adicionar
            </Button>
          )}
        </CardTitle>
        <CardDescription>Última semana</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta semanal</span>
            <span className="font-medium">
              {activityStats.totalDuration}/{activityStats.weeklyGoal} min
            </span>
          </div>
          <Progress value={activityStats.weeklyProgress} />
          <p className="text-xs text-muted-foreground">
            {activityStats.weeklyProgress >= 100 
              ? '🎯 Meta atingida!' 
              : `${(100 - activityStats.weeklyProgress).toFixed(0)}% restante`
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="space-y-1 p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Atividades</p>
            <p className="text-2xl font-bold">{activityStats.activitiesCount}</p>
          </div>
          <div className="space-y-1 p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Flame className="h-3 w-3" />
              Calorias
            </p>
            <p className="text-2xl font-bold">{activityStats.totalCalories}</p>
          </div>
        </div>

        {/* Most Frequent */}
        {activityStats.mostFrequentType && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
            <span className="text-2xl">
              {ACTIVITY_ICONS[activityStats.mostFrequentType]}
            </span>
            <div>
              <p className="text-sm font-medium">Mais frequente</p>
              <p className="text-xs text-muted-foreground">
                {ACTIVITY_LABELS[activityStats.mostFrequentType]}
              </p>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {detailed && recentActivities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Histórico</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {ACTIVITY_ICONS[activity.activityType]}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {ACTIVITY_LABELS[activity.activityType]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.activityDate), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.durationMinutes} min</p>
                    {activity.caloriesBurned && (
                      <p className="text-xs text-muted-foreground">
                        {activity.caloriesBurned} cal
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
