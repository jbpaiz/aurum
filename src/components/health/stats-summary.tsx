'use client'

import { useMemo } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Calendar, Flame, Moon, Activity as ActivityIcon } from 'lucide-react'
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, subWeeks, subMonths, differenceInDays } from 'date-fns'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function StatsSummary() {
  const { weightLogs, activities, sleepLogs } = useHealth()

  const stats = useMemo(() => {
    const now = new Date()
    
    // Semanas
    const thisWeekStart = startOfWeek(now, { locale: ptBR })
    const thisWeekEnd = endOfWeek(now, { locale: ptBR })
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR })
    
    // Meses
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Peso - Semana
    const thisWeekWeights = weightLogs.filter(w => {
      const date = new Date(w.recordedAt)
      return date >= thisWeekStart && date <= thisWeekEnd
    })
    const lastWeekWeights = weightLogs.filter(w => {
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
      const date = new Date(a.activityDate)
      return date >= thisWeekStart && date <= thisWeekEnd
    })
    const lastWeekActivities = activities.filter(a => {
      const date = new Date(a.activityDate)
      return date >= lastWeekStart && date <= lastWeekEnd
    })
    
    const thisWeekActivityMinutes = thisWeekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
    const lastWeekActivityMinutes = lastWeekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
    const activityChangeWeek = lastWeekActivityMinutes > 0
      ? ((thisWeekActivityMinutes - lastWeekActivityMinutes) / lastWeekActivityMinutes) * 100
      : null

    const thisWeekCalories = thisWeekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)
    const lastWeekCalories = lastWeekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)

    // Sono - Semana
    const thisWeekSleep = sleepLogs.filter(s => {
      const date = new Date(s.sleepDate)
      return date >= thisWeekStart && date <= thisWeekEnd
    })
    const lastWeekSleep = sleepLogs.filter(s => {
      const date = new Date(s.sleepDate)
      return date >= lastWeekStart && date <= lastWeekEnd
    })
    
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
          {/* Peso */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Peso Médio</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">
                  {stats.week.weight.current ? `${stats.week.weight.current.toFixed(1)} kg` : 'N/A'}
                </span>
                {stats.week.weight.change !== null && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stats.week.weight.change)}
                    <span className={`text-sm ${getTrendColor(stats.week.weight.change)}`}>
                      {Math.abs(stats.week.weight.change).toFixed(1)} kg
                    </span>
                  </div>
                )}
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
