'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Edit2, Trash2, Plus, Minus as MinusIcon } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { WeightLog } from '@/types/health'
import { toast } from 'sonner'

interface WeightCardProps {
  detailed?: boolean
  onAddClick?: () => void
  onEditClick?: (log: WeightLog) => void
}

export function WeightCard({ detailed = false, onAddClick, onEditClick }: WeightCardProps) {
  const { weightLogs, weightStats, goals, deleteWeightLog, createWeightLog, updateWeightLog, createGoal, updateGoal } = useHealth()
  const [goalValue, setGoalValue] = useState<string>('')
  const [goalDate, setGoalDate] = useState<string>('')
  const [savingGoal, setSavingGoal] = useState(false)

  const weightGoal = goals.find(g => g.goalType === 'weight' && g.isActive)

  useEffect(() => {
    if (weightGoal) {
      setGoalValue(String(weightGoal.targetValue))
      setGoalDate(weightGoal.targetDate ? weightGoal.targetDate.split('T')[0] : '')
    }
  }, [weightGoal])

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

  const recentLogs = useMemo(() => {
    return weightLogs.slice(0, detailed ? 30 : 5)
  }, [weightLogs, detailed])

  const latestLog = weightLogs[0]

  const getTrendIcon = () => {
    if (!weightStats) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (weightStats.trend === 'up') return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (weightStats.trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (!weightStats) return 'text-muted-foreground'
    if (weightStats.trend === 'up') return 'text-orange-500'
    if (weightStats.trend === 'down') return 'text-green-500'
    return 'text-muted-foreground'
  }

  const handleQuickAdjust = async (delta: number) => {
    if (!latestLog) return
    try {
      await createWeightLog({ weight: Number((latestLog.weight + delta).toFixed(2)) })
      toast.success('Peso registrado rapidamente')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar ajuste rápido')
    }
  }

  const handleSaveGoal = async () => {
    const parsed = parseFloat(goalValue)
    if (Number.isNaN(parsed)) {
      toast.error('Informe um valor de meta válido')
      return
    }
    try {
      setSavingGoal(true)
      if (weightGoal) {
        await updateGoal(weightGoal.id, { targetValue: parsed, targetDate: goalDate || undefined })
      } else {
        await createGoal({ goalType: 'weight', targetValue: parsed, targetDate: goalDate || undefined })
      }
      toast.success('Meta de peso salva')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar meta')
    } finally {
      setSavingGoal(false)
    }
  }

  useEffect(() => {
    if (weightGoal) {
      setGoalValue(String(weightGoal.targetValue))
      setGoalDate(weightGoal.targetDate ? weightGoal.targetDate.split('T')[0] : '')
    }
  }, [weightGoal])

  return weightStats ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <span>Peso</span>
          <div className="flex flex-wrap gap-2 justify-end">
            {[-0.6, -0.5, -0.2, -0.1, 0.1, 0.2, 0.5, 0.6].map(delta => (
              <Button
                key={delta}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickAdjust(delta)}
                className="flex items-center gap-1"
              >
                {delta < 0 ? <MinusIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {Math.abs(delta)} kg
              </Button>
            ))}
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {weightStats.todayCount > 0 ? 'Peso de hoje' : 'Última medição'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weight */}
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{weightStats.current}</span>
            <span className="text-xl text-muted-foreground mb-1">kg</span>
            {getTrendIcon()}
          </div>
          {weightStats.changeFromYesterday !== null && (
            <p className={`text-sm ${getTrendColor()}`}>
              {weightStats.changeFromYesterday > 0 ? '+' : ''}
              {weightStats.changeFromYesterday.toFixed(1)} kg desde ontem
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="text-sm font-medium">{weightStats.min} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="text-sm font-medium">{weightStats.avg?.toFixed(1)} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="text-sm font-medium">{weightStats.max} kg</p>
          </div>
        </div>

        {/* Goal Progress / Editor */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Meta de peso</p>
              <p className="text-xs text-muted-foreground">Edite o alvo e a data limite</p>
            </div>
            <Button size="sm" onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? 'Salvando...' : 'Salvar meta'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Peso alvo (kg)"
              value={goalValue}
              onChange={e => setGoalValue(e.target.value)}
            />
            <Input
              type="date"
              value={goalDate}
              onChange={e => setGoalDate(e.target.value)}
            />
          </div>

          {weightStats.goalTarget && (
            <div className="space-y-2">
              <Progress value={Math.min(100, Math.max(0, (weightStats.goalProgress || 0) * 100))} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-sm font-semibold">{weightStats.goalTarget} kg</p>
                  {weightStats.goalDate && (
                    <p className="text-[11px] text-muted-foreground">Até {format(new Date(weightStats.goalDate), 'dd/MM/yyyy')}</p>
                  )}
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="text-sm font-semibold">{weightStats.current} kg</p>
                  <p className="text-[11px] text-muted-foreground">Mede hoje {weightStats.todayCount > 0 ? '✔' : '—'}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Restam</p>
                  <p className="text-sm font-semibold">
                    {weightStats.current !== null && weightStats.goalTarget !== null
                      ? `${Math.max(0, Math.abs(weightStats.current - weightStats.goalTarget)).toFixed(1)} kg`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Para alcançar a meta</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-sm font-semibold">
                    {weightStats.etaWeeksToGoal ? `~${weightStats.etaWeeksToGoal.toFixed(0)} sem` : 'Indeterminado'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Mantendo o ritmo atual</p>
                </div>
              </div>

              {weightStats.goalExpectedToday !== null && weightStats.goalExpectedToday !== undefined && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Para estar no ritmo</p>
                    <p className="text-sm font-semibold">{weightStats.goalExpectedToday.toFixed(1)} kg</p>
                    <p className="text-[11px] text-muted-foreground">Peso esperado para hoje</p>
                  </div>
                  {weightStats.goalDeltaFromExpected !== null && weightStats.goalDeltaFromExpected !== undefined && (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Diferença hoje</p>
                      <p className="text-sm font-semibold">
                        {Math.abs(weightStats.goalDeltaFromExpected).toFixed(1)} kg {weightStats.goalDeltaFromExpected > 0 ? 'acima' : 'abaixo'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Em relação ao esperado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights removidos */}

        {/* Recent Logs */}
        {detailed && recentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Histórico</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 gap-2">
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{log.weight} kg</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.recordedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
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
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Peso</span>
          {onAddClick && (
            <Button size="sm" variant="outline" onClick={onAddClick}>
              Adicionar
            </Button>
          )}
        </CardTitle>
        <CardDescription>Nenhum registro ainda</CardDescription>
      </CardHeader>
    </Card>
  )
}
