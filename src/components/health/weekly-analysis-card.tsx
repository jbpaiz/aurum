'use client'

import { useMemo } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, Minus, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval, differenceInCalendarWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeekAnalysis {
  weekStart: Date
  weekEnd: Date
  minWeight: number
  maxWeight: number
  avgWeight: number
  variation: number
  weeklyChange: number | null
  isHealthyPace: boolean
  label: string
}

export function WeeklyAnalysisCard() {
  const { weightLogs } = useHealth()

  const weeklyData = useMemo(() => {
    if (weightLogs.length === 0) return []

    const now = new Date()
    const oldestLogDate = weightLogs.reduce((oldest, log) => {
      const logDate = new Date(log.recordedAt)
      return logDate < oldest ? logDate : oldest
    }, new Date(weightLogs[0].recordedAt))
    const weeksToShow = differenceInCalendarWeeks(now, oldestLogDate, { locale: ptBR }) + 1

    const weeks: WeekAnalysis[] = []

    for (let i = 0; i < weeksToShow; i++) {
      const weekDate = subWeeks(now, i)
      const weekStart = startOfWeek(weekDate, { locale: ptBR })
      const weekEnd = endOfWeek(weekDate, { locale: ptBR })

      // Filtrar logs dessa semana
      const weekLogs = weightLogs.filter(log => {
        const logDate = new Date(log.recordedAt)
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd })
      })

      if (weekLogs.length === 0) continue

      const weights = weekLogs.map(log => log.weight)
      const minWeight = Math.min(...weights)
      const maxWeight = Math.max(...weights)
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
      const variation = maxWeight - minWeight

      // Calcular mudança em relação à semana anterior
      let weeklyChange: number | null = null
      if (i < weeksToShow - 1) {
        const prevWeekDate = subWeeks(now, i + 1)
        const prevWeekStart = startOfWeek(prevWeekDate, { locale: ptBR })
        const prevWeekEnd = endOfWeek(prevWeekDate, { locale: ptBR })

        const prevWeekLogs = weightLogs.filter(log => {
          const logDate = new Date(log.recordedAt)
          return isWithinInterval(logDate, { start: prevWeekStart, end: prevWeekEnd })
        })

        if (prevWeekLogs.length > 0) {
          const prevWeights = prevWeekLogs.map(log => log.weight)
          const prevMinWeight = Math.min(...prevWeights)
          weeklyChange = minWeight - prevMinWeight
        }
      }

      // Ritmo saudável: 0.5kg a 1kg de perda por semana
      const isHealthyPace = weeklyChange !== null && weeklyChange <= 0 && Math.abs(weeklyChange) >= 0.3 && Math.abs(weeklyChange) <= 1.2

      weeks.push({
        weekStart,
        weekEnd,
        minWeight,
        maxWeight,
        avgWeight,
        variation,
        weeklyChange,
        isHealthyPace,
        label: `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM', { locale: ptBR })}`
      })
    }

    return weeks // Mais recente primeiro (semana atual no topo)
  }, [weightLogs])

  if (weeklyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Semanal</CardTitle>
          <CardDescription>Acompanhe sua variação e progresso semanal</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum dado disponível ainda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Semanal Detalhada</CardTitle>
        <CardDescription>
          Variação intra-semanal e taxa de progresso ({weeklyData.length} semanas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
          {weeklyData.map((week, index) => {
            const isCurrentWeek = index === 0
            
            return (
              <div 
                key={week.label} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${
                  isCurrentWeek ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {week.label}
                      {isCurrentWeek && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Semana Atual
                        </Badge>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>
                      Min: <strong className="text-foreground">{week.minWeight.toFixed(1)}kg</strong>
                    </span>
                    <span>
                      Máx: <strong className="text-foreground">{week.maxWeight.toFixed(1)}kg</strong>
                    </span>
                    <span>
                      Variação: <strong className="text-foreground">{week.variation.toFixed(1)}kg</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {week.weeklyChange !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                      week.weeklyChange < 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : week.weeklyChange > 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {week.weeklyChange < 0 ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : week.weeklyChange > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {week.weeklyChange >= 0 ? '+' : ''}{week.weeklyChange.toFixed(2)}kg
                      </span>
                    </div>
                  )}

                  {week.weeklyChange !== null && week.weeklyChange < 0 && (
                    <div title={week.isHealthyPace ? 'Ritmo saudável (0.3-1.2kg/semana)' : 'Fora do ritmo ideal'}>
                      {week.isHealthyPace ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Como interpretar:</p>
              <ul className="space-y-0.5">
                <li>• <strong>Variação semanal:</strong> Diferença entre seu peso mínimo e máximo na semana (flutuações normais)</li>
                <li>• <strong>Taxa semanal:</strong> Comparação do peso mínimo com a semana anterior</li>
                <li>• <CheckCircle2 className="inline h-3 w-3 text-green-600" /> Ritmo saudável: 0.3-1.2kg de perda por semana</li>
                <li>• <AlertTriangle className="inline h-3 w-3 text-amber-600" /> Fora do ritmo: pode ser muito rápido ou muito lento</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
