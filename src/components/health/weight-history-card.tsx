'use client'

import { useMemo } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { WeightLog } from '@/types/health'
import { toast } from 'sonner'

interface WeightHistoryCardProps {
  onEditClick?: (log: WeightLog) => void
}

export function WeightHistoryCard({ onEditClick }: WeightHistoryCardProps) {
  const { weightLogs, weightStats, deleteWeightLog } = useHealth()

  const recentLogs = useMemo(() => {
    return weightLogs
  }, [weightLogs])

  const goalPlan = useMemo(() => {
    if (!weightStats?.goalTarget || !weightStats?.goalDate || weightLogs.length === 0) return null
    const ascLogs = [...weightLogs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    const startLog = ascLogs[0]
    const startTime = new Date(startLog.recordedAt).getTime()
    const goalTime = new Date(weightStats.goalDate).getTime()
    if (Number.isNaN(startTime) || Number.isNaN(goalTime) || goalTime === startTime) return null
    return {
      startWeight: startLog.weight,
      startTime,
      goalTime,
      goalTarget: weightStats.goalTarget
    }
  }, [weightLogs, weightStats?.goalTarget, weightStats?.goalDate])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    
    try {
      await deleteWeightLog(id)
      toast.success('Registro excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir registro')
    }
  }

  if (recentLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Nenhum registro ainda</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico</CardTitle>
        <CardDescription>{recentLogs.length} registros de peso</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {recentLogs.map((log, index) => {
            const prevLog = recentLogs[index + 1]
            const delta = prevLog ? log.weight - prevLog.weight : null
            const deltaLabel = delta === null ? null : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`
            const deltaClass = delta === null
              ? ''
              : delta > 0
                ? 'text-red-500'
                : delta < 0
                  ? 'text-emerald-500'
                  : 'text-muted-foreground'

            const goalComparison = goalPlan
              ? (() => {
                const logTime = new Date(log.recordedAt).getTime()
                const clamped = Math.min(Math.max(logTime, goalPlan.startTime), goalPlan.goalTime)
                const progress = (clamped - goalPlan.startTime) / (goalPlan.goalTime - goalPlan.startTime)
                const expected = goalPlan.startWeight + (goalPlan.goalTarget - goalPlan.startWeight) * progress
                const deltaFromExpected = log.weight - expected
                const needsToGain = goalPlan.goalTarget > goalPlan.startWeight
                const isAhead = needsToGain ? deltaFromExpected >= 0 : deltaFromExpected <= 0
                const minRange = Math.min(goalPlan.startWeight, goalPlan.goalTarget)
                const maxRange = Math.max(goalPlan.startWeight, goalPlan.goalTarget)
                const range = maxRange - minRange || 1
                const expectedPercent = Math.min(100, Math.max(0, ((expected - minRange) / range) * 100))
                const actualPercent = Math.min(100, Math.max(0, ((log.weight - minRange) / range) * 100))
                return {
                  expected,
                  deltaFromExpected,
                  isAhead,
                  expectedPercent,
                  actualPercent,
                  minRange,
                  maxRange
                }
              })()
              : null

            return (
              <div key={log.id} className="flex items-center justify-between text-sm border-b border-muted/40 dark:border-muted/60 pb-2 last:border-0 gap-2">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.weight} kg</span>
                    {delta !== null && (
                      <span className={`text-xs ${deltaClass}`}>
                        {deltaLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.recordedAt), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {goalComparison && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Meta no dia: {goalComparison.expected.toFixed(1)} kg</span>
                        <span className={goalComparison.isAhead ? 'text-emerald-600' : 'text-red-600'}>
                          {goalComparison.deltaFromExpected > 0 ? '+' : ''}{goalComparison.deltaFromExpected.toFixed(1)} kg vs meta
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted">
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-muted-foreground/60"
                          style={{ left: `${goalComparison.expectedPercent}%`, transform: 'translateX(-50%)' }}
                        />
                        <div
                          className={`absolute top-0 bottom-0 w-[3px] ${goalComparison.isAhead ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ left: `${goalComparison.actualPercent}%`, transform: 'translateX(-50%)' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{goalComparison.minRange.toFixed(1)} kg</span>
                        <span>{goalComparison.maxRange.toFixed(1)} kg</span>
                      </div>
                    </div>
                  )}
                  {log.note && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {log.note}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {onEditClick && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onEditClick(log)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
