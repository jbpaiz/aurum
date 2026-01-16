'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Edit2, Trash2 } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const { weightLogs, weightStats, deleteWeightLog } = useHealth()

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

  if (!weightStats) {
    return (
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

  const getTrendIcon = () => {
    if (weightStats.trend === 'up') return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (weightStats.trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (weightStats.trend === 'up') return 'text-orange-500'
    if (weightStats.trend === 'down') return 'text-green-500'
    return 'text-muted-foreground'
  }

  return (
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
  )
}
