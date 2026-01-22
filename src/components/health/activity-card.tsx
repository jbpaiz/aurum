'use client'

import { useMemo } from 'react'
import { Flame, Edit2, Trash2, Target, Clock, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react'
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
          <CardTitle className="flex items-start justify-between gap-3">
            <span>Atividades</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {onAddClick && (
                <Button size="sm" variant="outline" onClick={onAddClick}>
                  Adicionar
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>Nenhuma atividade registrada</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const goalReached = activityStats.weeklyProgress >= 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <span>Atividades</span>
          <div className="flex flex-wrap gap-2 justify-end">
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Última semana</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Total */}
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{activityStats.totalDuration}</span>
            <span className="text-xl text-muted-foreground mb-1">min</span>
          </div>
          <p className={`text-sm ${goalReached ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {goalReached ? '🎯 Meta semanal atingida!' : `${(100 - activityStats.weeklyProgress).toFixed(0)}% restante`}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta semanal</span>
            <span className="font-medium">{activityStats.totalDuration}/{activityStats.weeklyGoal} min</span>
          </div>
          <Progress value={activityStats.weeklyProgress} />
        </div>

        {/* Stats Grid styled like Weight card */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Meta</p>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{activityStats.weeklyGoal} min</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">Meta semanal</p>
            </div>

            <div className={`rounded-md border p-3 space-y-1 ${
              goalReached ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${
                  goalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <p className={`text-xs font-medium ${
                  goalReached ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
                }`}>Atual</p>
              </div>
              <p className={`text-lg font-bold ${
                goalReached ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'
              }`}>{activityStats.totalDuration} min</p>
              <div className="flex items-center gap-1">
                {goalReached && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                <p className={`text-[10px] ${
                  goalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
                }`}>{goalReached ? 'Meta atingida' : 'Meta em andamento'}</p>
              </div>
            </div>

            <div className={`rounded-md border p-3 space-y-1 ${
              activityStats.totalDuration !== null && activityStats.weeklyGoal !== null && activityStats.totalDuration >= activityStats.weeklyGoal ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30' : 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${
                  activityStats.totalDuration !== null && activityStats.weeklyGoal !== null && activityStats.totalDuration >= activityStats.weeklyGoal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`} />
                <p className={`text-xs font-medium ${
                  activityStats.totalDuration !== null && activityStats.weeklyGoal !== null && activityStats.totalDuration >= activityStats.weeklyGoal ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                }`}>Restam</p>
              </div>
              <p className={`text-lg font-bold ${
                activityStats.totalDuration !== null && activityStats.weeklyGoal !== null && activityStats.totalDuration >= activityStats.weeklyGoal ? 'text-emerald-900 dark:text-emerald-100' : 'text-amber-900 dark:text-amber-100'
              }`}>
                {activityStats.totalDuration !== null && activityStats.weeklyGoal !== null
                  ? `${Math.max(0, (activityStats.weeklyGoal - activityStats.totalDuration)).toFixed(0)} min`
                  : '—'}
              </p>
              <p className={`text-[10px] ${
                activityStats.totalDuration !== null && activityStats.weeklyGoal !== null && activityStats.totalDuration >= activityStats.weeklyGoal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>Para atingir a meta</p>
            </div>

            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Distância</p>
              </div>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{activityStats.totalDistanceKm ? `${activityStats.totalDistanceKm} km` : '—'}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Últimos 7 dias</p>
            </div>
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
                    {activity.distanceKm !== null && activity.distanceKm !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {activity.distanceKm} km
                      </p>
                    )}
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
