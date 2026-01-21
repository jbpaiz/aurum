'use client'

import { useMemo } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Calendar, Flame, Moon, Activity as ActivityIcon, Target, AlertTriangle } from 'lucide-react'
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subWeeks, subMonths, differenceInDays, addDays, startOfDay, subDays } from 'date-fns'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export function StatsSummary() {
  const { weightLogs, activities, sleepLogs, weightStats } = useHealth()

  const stats = useMemo(() => {
    const now = new Date()
    
    console.log('=== DEBUG STATS ===')
    console.log('Data atual:', now)
    console.log('Atividades totais:', activities.length)
    console.log('Sleep logs totais:', sleepLogs.length)
    
    // Semanas
    const thisWeekStart = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 })
    const thisWeekEnd = endOfWeek(now, { locale: ptBR, weekStartsOn: 1 })
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR, weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR, weekStartsOn: 1 })
    
    console.log('Semana atual:', thisWeekStart, 'até', thisWeekEnd)
    
    // Meses
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Filtrar apenas o último registro de cada dia
    const logsByDay: Record<string, typeof weightLogs[0]> = {}
    weightLogs.forEach(log => {
      const day = new Date(log.recordedAt).toISOString().slice(0, 10)
      if (!logsByDay[day] || new Date(log.recordedAt) > new Date(logsByDay[day].recordedAt)) {
        logsByDay[day] = log
      }
    })
    const dailyLogs = Object.values(logsByDay)
    // Considerar apenas os últimos 14 dias
    const last14Days = subDays(now, 14)
    const recentLogs = dailyLogs.filter(l => new Date(l.recordedAt) >= last14Days)
    // Se não houver pelo menos 3 registros, usar todos
    const trendLogs = recentLogs.length >= 3 ? recentLogs : dailyLogs
    
    // Peso - Semana
    const thisWeekWeights = trendLogs.filter(w => {
      const date = new Date(w.recordedAt)
      return date >= thisWeekStart && date <= thisWeekEnd
    })
    const lastWeekWeights = trendLogs.filter(w => {
      const date = new Date(w.recordedAt)
      return date >= lastWeekStart && date <= lastWeekEnd
    })
    
    const avgWeightThisWeek = thisWeekWeights.length > 0
      ? thisWeekWeights.reduce((sum, w) => sum + w.weight, 0) / thisWeekWeights.length
      : null
    const avgWeightLastWeek = lastWeekWeights.length > 0
      ? lastWeekWeights.reduce((sum, w) => sum + w.weight, 0) / lastWeekWeights.length
      : null
    
    const weightChangeWeek = avgWeightThisWeek && avgWeightLastWeek
      ? avgWeightThisWeek - avgWeightLastWeek
      : null

    // Atividades - Semana
    const thisWeekActivities = activities.filter(a => {
      const [year, month, day] = a.activityDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const isInWeek = date >= thisWeekStart && date <= thisWeekEnd
      console.log(`Atividade ${a.activityDate}:`, date, 'na semana?', isInWeek)
      return isInWeek
    })
    const lastWeekActivities = activities.filter(a => {
      const [year, month, day] = a.activityDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date >= lastWeekStart && date <= lastWeekEnd
    })
    
    console.log('Atividades desta semana:', thisWeekActivities.length)
    
    const thisWeekActivityMinutes = thisWeekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
    const lastWeekActivityMinutes = lastWeekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
    const activityChangeWeek = lastWeekActivityMinutes > 0
      ? ((thisWeekActivityMinutes - lastWeekActivityMinutes) / lastWeekActivityMinutes) * 100
      : null

    const thisWeekCalories = thisWeekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)
    const lastWeekCalories = lastWeekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)

    // Sono - Semana
    const thisWeekSleep = sleepLogs.filter(s => {
      const [year, month, day] = s.sleepDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const isInWeek = date >= thisWeekStart && date <= thisWeekEnd
      console.log(`Sono ${s.sleepDate}:`, date, 'na semana?', isInWeek)
      return isInWeek
    })
    const lastWeekSleep = sleepLogs.filter(s => {
      const [year, month, day] = s.sleepDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date >= lastWeekStart && date <= lastWeekEnd
    })
    
    console.log('Sleep logs desta semana:', thisWeekSleep.length)
    
    const avgSleepThisWeek = thisWeekSleep.length > 0
      ? thisWeekSleep.reduce((sum, s) => sum + s.durationMinutes, 0) / thisWeekSleep.length
      : null
    const avgSleepLastWeek = lastWeekSleep.length > 0
      ? lastWeekSleep.reduce((sum, s) => sum + s.durationMinutes, 0) / lastWeekSleep.length
      : null
    
    const sleepChangeWeek = avgSleepThisWeek && avgSleepLastWeek
      ? avgSleepThisWeek - avgSleepLastWeek
      : null

    // Mês
    const thisMonthWeights = weightLogs.filter(w => {
      const date = new Date(w.recordedAt)
      return date >= thisMonthStart && date <= thisMonthEnd
    })
    const lastMonthWeights = weightLogs.filter(w => {
      const date = new Date(w.recordedAt)
      return date >= lastMonthStart && date <= lastMonthEnd
    })
    
    const avgWeightThisMonth = thisMonthWeights.length > 0
      ? thisMonthWeights.reduce((sum, w) => sum + w.weight, 0) / thisMonthWeights.length
      : null
    const avgWeightLastMonth = lastMonthWeights.length > 0
      ? lastMonthWeights.reduce((sum, w) => sum + w.weight, 0) / lastMonthWeights.length
      : null
    
    const weightChangeMonth = avgWeightThisMonth && avgWeightLastMonth
      ? avgWeightThisMonth - avgWeightLastMonth
      : null

    // Streaks (dias consecutivos)
    const sortedWeights = [...weightLogs].sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )
    let weightStreak = 0
    let lastDate: Date | null = null
    for (const log of sortedWeights) {
      const logDate = new Date(log.recordedAt)
      if (!lastDate) {
        if (differenceInDays(now, logDate) <= 1) {
          weightStreak = 1
          lastDate = logDate
        } else {
          break
        }
      } else {
        if (differenceInDays(lastDate, logDate) === 1) {
          weightStreak++
          lastDate = logDate
        } else {
          break
        }
      }
    }

    const sortedActivities = [...activities].sort((a, b) => 
      new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
    )
    let activityStreak = 0
    lastDate = null
    for (const activity of sortedActivities) {
      const actDate = new Date(activity.activityDate)
      if (!lastDate) {
        if (differenceInDays(now, actDate) <= 1) {
          activityStreak = 1
          lastDate = actDate
        } else {
          break
        }
      } else {
        if (differenceInDays(lastDate, actDate) === 1) {
          activityStreak++
          lastDate = actDate
        } else {
          break
        }
      }
    }

    const sortedSleep = [...sleepLogs].sort((a, b) => 
      new Date(b.sleepDate).getTime() - new Date(a.sleepDate).getTime()
    )
    let sleepStreak = 0
    lastDate = null
    for (const log of sortedSleep) {
      const logDate = new Date(log.sleepDate)
      if (!lastDate) {
        if (differenceInDays(now, logDate) <= 1) {
          sleepStreak = 1
          lastDate = logDate
        } else {
          break
        }
      } else {
        if (differenceInDays(lastDate, logDate) === 1) {
          sleepStreak++
          lastDate = logDate
        } else {
          break
        }
      }
    }

    return {
      week: {
        weight: { current: avgWeightThisWeek, change: weightChangeWeek },
        activity: { 
          minutes: thisWeekActivityMinutes,
          change: activityChangeWeek,
          calories: thisWeekCalories,
          caloriesLast: lastWeekCalories,
          count: thisWeekActivities.length
        },
        sleep: { current: avgSleepThisWeek, change: sleepChangeWeek, count: thisWeekSleep.length }
      },
      month: {
        weight: { current: avgWeightThisMonth, change: weightChangeMonth },
        activities: thisMonthWeights.length,
        sleep: thisMonthWeights.length
      },
      streaks: {
        weight: weightStreak,
        activity: activityStreak,
        sleep: sleepStreak
      }
    }
  }, [weightLogs, activities, sleepLogs])

  const getTrendIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (change > 0) return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = (change: number | null) => {
    if (change === null) return 'text-muted-foreground'
    if (change > 0) return 'text-orange-500'
    if (change < 0) return 'text-green-500'
    return 'text-muted-foreground'
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Resumo Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo Semanal
          </CardTitle>
          <CardDescription>Esta semana vs semana passada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Estimada da Meta */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Data Estimada da Meta
              </p>
              <div className="flex flex-col gap-1 mt-1">
                {(() => {
                  if (!weightStats?.goalTarget || !weightStats?.goalDate || weightLogs.length < 2) {
                    return (
                      <>
                        <span className="text-2xl font-bold text-muted-foreground">--</span>
                        <p className="text-xs text-muted-foreground">
                          {!weightStats?.goalTarget || !weightStats?.goalDate 
                            ? 'Configure uma meta de peso'
                            : 'Adicione mais registros de peso'
                          }
                        </p>
                      </>
                    )
                  }

                  // Calcular trendLogs localmente
                  // Filtrar apenas o último registro de cada dia
                  const logsByDay: Record<string, typeof weightLogs[0]> = {}
                  weightLogs.forEach(log => {
                    const day = new Date(log.recordedAt).toISOString().slice(0, 10)
                    if (!logsByDay[day] || new Date(log.recordedAt) > new Date(logsByDay[day].recordedAt)) {
                      logsByDay[day] = log
                    }
                  })
                  const dailyLogs = Object.values(logsByDay)
                  // Considerar apenas os últimos 14 dias
                  const now = new Date()
                  const last14Days = subDays(now, 14)
                  const recentLogs = dailyLogs.filter(l => new Date(l.recordedAt) >= last14Days)
                  // Se não houver pelo menos 3 registros, usar todos

                  const trendLogs = recentLogs.length >= 3 ? recentLogs : dailyLogs


                  // --- NOVA LÓGICA: diferença grande entre último e penúltimo registro ---
                  const sortedRecent = [...trendLogs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                  if (sortedRecent.length >= 2) {
                    const last = sortedRecent[sortedRecent.length - 1]
                    const prev = sortedRecent[sortedRecent.length - 2]
                    const diff = last.weight - prev.weight
                    const daysDiff = (new Date(last.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / (1000 * 60 * 60 * 24)
                    if (Math.abs(diff) > 1 && daysDiff <= 2) {
                      // Exibir tendência baseada nessa diferença
                      const tendenciaSemanal = (diff / daysDiff) * 7
                      return (
                        <div className="rounded-md border border-orange-400 bg-orange-50 dark:bg-orange-900/30 p-4 flex flex-col items-center text-center">
                          <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
                          <span className="text-xl font-bold text-orange-600">Mudança brusca detectada</span>
                          <span className="text-sm font-semibold text-orange-700 mt-1">
                            Tendência: {tendenciaSemanal > 0 ? '+' : ''}{tendenciaSemanal.toFixed(1)} kg/sem
                          </span>
                          <p className="text-xs text-orange-400 mt-1">Última variação: {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg em {daysDiff.toFixed(0)} dia(s).</p>
                        </div>
                      )
                    }
                  }

                  // Calcular regressão linear
                  const sorted = [...trendLogs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                  const trendWeights = sorted.map(w => w.weight)
                  const timestamps = sorted.map(w => new Date(w.recordedAt).getTime())

                  // Normalizar timestamps (subtrair o primeiro) para evitar problemas numéricos
                  const baseTime = timestamps[0]
                  const normalizedTimestamps = timestamps.map(t => t - baseTime)

                  const xMean = normalizedTimestamps.reduce((a, b) => a + b, 0) / normalizedTimestamps.length
                  const yMean = trendWeights.reduce((a, b) => a + b, 0) / trendWeights.length

                  let numerator = 0
                  let denominator = 0
                  for (let i = 0; i < normalizedTimestamps.length; i++) {
                    const dx = normalizedTimestamps[i] - xMean
                    numerator += dx * (trendWeights[i] - yMean)
                    denominator += dx * dx
                  }

                  const slope = denominator !== 0 ? numerator / denominator : 0
                  const intercept = yMean - slope * xMean

                  // Se a inclinação for zero (peso não está mudando), não há tendência
                  if (slope === 0) {
                    return (
                      <>
                        <span className="text-2xl font-bold text-muted-foreground">--</span>
                        <p className="text-xs text-muted-foreground">Sem tendência detectada</p>
                      </>
                    )
                  }

                  // Calcular quando atingirá a meta (usando tempo normalizado)
                  const normalizedEstimatedTime = (weightStats.goalTarget - intercept) / slope
                  const estimatedTimestamp = baseTime + normalizedEstimatedTime
                  const estimatedDate = new Date(estimatedTimestamp)
                  const goalDate = new Date(weightStats.goalDate)
                  const currentWeight = trendWeights[trendWeights.length - 1]

                  // Verificar se está indo na direção certa
                  const isGainingWeight = slope > 0
                  const needsToGain = weightStats.goalTarget > currentWeight
                  const isWrongDirection = isGainingWeight !== needsToGain

                  if (isWrongDirection) {
                    const tendenciaValor = slope * 7;
                    if (Math.abs(tendenciaValor) < 0.05) {
                      return (
                        <div className="rounded-md border border-gray-400 bg-gray-50 dark:bg-gray-900/30 p-4 flex flex-col items-center text-center">
                          <Minus className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-xl font-bold text-gray-600">Peso estável</span>
                          <span className="text-sm font-medium text-gray-500 mt-1">Variação semanal: ±0.0 kg/sem</span>
                          <p className="text-xs text-gray-400 mt-1">Nenhuma tendência significativa detectada.</p>
                        </div>
                      )
                    }
                    const tendencia = slope > 0 ? `ganhar peso (+${Math.abs(tendenciaValor).toFixed(1)} kg/sem)` : `perder peso (-${Math.abs(tendenciaValor).toFixed(1)} kg/sem)`
                    return (
                      <div className="rounded-md border border-orange-400 bg-orange-50 dark:bg-orange-900/30 p-4 flex flex-col items-center text-center">
                        <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
                        <span className="text-xl font-bold text-orange-600">Atenção</span>
                        <span className="text-sm text-orange-500 font-medium mt-1">Sua tendência está oposta à meta</span>
                        <span className="text-sm font-semibold text-orange-700 mt-1">Tendência: {tendencia}</span>
                        <p className="text-xs text-orange-400 mt-1">Ajuste sua rotina para voltar ao caminho desejado.</p>
                      </div>
                    )
                  }

                  // Verificar se já passou da data
                  if (estimatedDate < new Date()) {
                    return (
                      <>
                        <span className="text-2xl font-bold text-muted-foreground">--</span>
                        <p className="text-xs text-muted-foreground">Data já passou</p>
                      </>
                    )
                  }

                  const daysUntilEstimated = differenceInDays(estimatedDate, new Date())
                  const daysUntilGoal = differenceInDays(goalDate, new Date())
                  const isOnTrack = daysUntilEstimated <= daysUntilGoal

                  return (
                    <>
                      <span className={`text-2xl font-bold ${
                        isOnTrack ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        {format(estimatedDate, "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      <p className={`text-xs ${
                        isOnTrack ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        {isOnTrack 
                          ? `✓ ${Math.abs(daysUntilGoal - daysUntilEstimated)} dias antes da meta` 
                          : `⚠ ${Math.abs(daysUntilGoal - daysUntilEstimated)} dias após a meta`
                        }
                      </p>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Atividades */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <ActivityIcon className="h-4 w-4" />
                Atividades
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{stats.week.activity.minutes} min</span>
                {stats.week.activity.change !== null && (
                  <div className="flex items-center gap-1">
                    {stats.week.activity.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : stats.week.activity.change < 0 ? (
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm ${
                      stats.week.activity.change > 0 ? 'text-green-500' :
                      stats.week.activity.change < 0 ? 'text-orange-500' : 'text-muted-foreground'
                    }`}>
                      {Math.abs(stats.week.activity.change).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{stats.week.activity.count} atividades</span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {stats.week.activity.calories} cal
                </span>
              </div>
            </div>
          </div>

          {/* Sono */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Sono Médio
              </p>
              <div className="flex items-center gap-2 mt-1">
                {stats.week.sleep.current ? (
                  <>
                    <span className="text-2xl font-bold">
                      {Math.floor(stats.week.sleep.current / 60)}h {stats.week.sleep.current % 60}min
                    </span>
                    {stats.week.sleep.change !== null && (
                      <div className="flex items-center gap-1">
                        {stats.week.sleep.change > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : stats.week.sleep.change < 0 ? (
                          <TrendingDown className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${
                          stats.week.sleep.change > 0 ? 'text-green-500' :
                          stats.week.sleep.change < 0 ? 'text-orange-500' : 'text-muted-foreground'
                        }`}>
                          {Math.abs(Math.floor(stats.week.sleep.change / 60))}h {Math.abs(stats.week.sleep.change % 60)}min
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold">N/A</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.week.sleep.count} noites registradas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consistência e Streaks */}
      <Card>
        <CardHeader>
          <CardTitle>Consistência</CardTitle>
          <CardDescription>Dias consecutivos de registro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight Streak */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Peso</p>
              <p className="text-xs text-muted-foreground">Registros consecutivos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.streaks.weight}
              </p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>
          </div>

          {/* Activity Streak */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Atividades</p>
              <p className="text-xs text-muted-foreground">Dias consecutivos ativos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.streaks.activity}
              </p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>
          </div>

          {/* Sleep Streak */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Sono</p>
              <p className="text-xs text-muted-foreground">Registros consecutivos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.streaks.sleep}
              </p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>
          </div>

          {/* Motivação */}
          {(stats.streaks.weight >= 7 || stats.streaks.activity >= 7 || stats.streaks.sleep >= 7) && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                🎉 Parabéns!
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                Você está mantendo uma ótima consistência! Continue assim!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
