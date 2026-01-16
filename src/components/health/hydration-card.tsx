'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useHealth } from '@/contexts/health-context'
import { HydrationLog } from '@/types/health'
import { Droplets, Plus, Pencil, Trash2, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface HydrationCardProps {
  detailed?: boolean
  onAddClick: () => void
  onEditClick?: (log: HydrationLog) => void
  onGoalClick: () => void
}

export function HydrationCard({ detailed = false, onAddClick, onEditClick, onGoalClick }: HydrationCardProps) {
  const { hydrationLogs, hydrationStats, deleteHydrationLog } = useHealth()
  const [showAll, setShowAll] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return

    try {
      await deleteHydrationLog(id)
      toast.success('Registro excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir registro')
    }
  }

  const todayLogs = hydrationLogs.filter(
    log => log.logDate === format(new Date(), 'yyyy-MM-dd')
  )

  const displayLogs = detailed 
    ? (showAll ? todayLogs : todayLogs.slice(0, 10))
    : todayLogs.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Hidratação</CardTitle>
              <CardDescription>Água consumida hoje</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onGoalClick}>
              <Settings className="h-4 w-4" />
            </Button>
            {!detailed && (
              <Button size="sm" onClick={onAddClick}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hydrationStats ? (
          <div className="text-center py-4 text-muted-foreground">
            <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum registro hoje</p>
            <p className="text-sm">Comece a registrar seu consumo de água</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {hydrationStats.todayTotal}ml / {hydrationStats.dailyGoal}ml
                </span>
                <span className="text-muted-foreground">
                  {hydrationStats.progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={hydrationStats.progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {hydrationStats.progress >= 100
                  ? '🎉 Meta diária atingida!'
                  : `Faltam ${hydrationStats.dailyGoal - hydrationStats.todayTotal}ml para sua meta`}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Média Semanal</p>
                <p className="text-lg font-semibold">{Math.round(hydrationStats.avgDailyLast7Days)}ml</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registros Hoje</p>
                <p className="text-lg font-semibold">{hydrationStats.logsToday}</p>
              </div>
            </div>

            {/* Today's Logs */}
            {todayLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Registros de Hoje</h4>
                <div className="space-y-2">
                  {displayLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.amountMl}ml</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.loggedAt), 'HH:mm')}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                        )}
                      </div>
                      {onEditClick && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditClick(log)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(log.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {detailed && todayLogs.length > 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? 'Ver menos' : `Ver todos (${todayLogs.length})`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
