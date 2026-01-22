'use client'

import { useMemo } from 'react'
import { Flame, Edit2, Trash2 } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ACTIVITY_LABELS, ACTIVITY_ICONS, type Activity } from '@/types/health'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface ActivityCardProps {
  detailed?: boolean
  onAddClick?: () => void
  onEditClick?: (activity: Activity) => void
}

export function ActivityCard({ detailed = false, onAddClick, onEditClick }: ActivityCardProps) {
  const { activities, activityStats, deleteActivity } = useHealth()

  const safeDate = (iso: string) => {
    if (!iso) return new Date('')
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta atividade?')) return
    
    try {
      await deleteActivity(id)
      toast.success('Atividade excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir atividade')
    }
  }

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
                <div key={activity.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl">
                      {ACTIVITY_ICONS[activity.activityType]}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {ACTIVITY_LABELS[activity.activityType]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(safeDate(activity.activityDate), "dd 'de' MMM", { locale: ptBR })}
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
                  <div className="flex gap-1">
                    {onEditClick && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onEditClick(activity)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(activity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
