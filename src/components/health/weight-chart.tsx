'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'week' | 'month' | 'year' | 'all'

export function WeightChart() {
  const { weightLogs, weightStats } = useHealth()
  const [period, setPeriod] = useState<Period>('month')

  const chartData = useMemo(() => {
    if (weightLogs.length === 0) return []

    const normalize = (value: string | Date) => startOfDay(new Date(value))
    const asDate = (value: string | Date) => new Date(value)

    const now = new Date()
    const today = startOfDay(now)
    let filteredLogs = weightLogs

    // Médias por dia da semana (usa todo o histórico para dar base estável)
    const weekdayBuckets: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    weightLogs.forEach(log => {
      const weekday = asDate(log.recordedAt).getDay()
      weekdayBuckets[weekday].push(log.weight)
    })
    const weekdayAverages: Record<number, number | undefined> = { 0: undefined, 1: undefined, 2: undefined, 3: undefined, 4: undefined, 5: undefined, 6: undefined }
    ;(Object.keys(weekdayBuckets) as Array<keyof typeof weekdayBuckets>).forEach(key => {
      const bucket = weekdayBuckets[key]
      if (bucket.length > 0) {
        weekdayAverages[key] = bucket.reduce((a, b) => a + b, 0) / bucket.length
      }
    })

    // Filtrar por período
    switch (period) {
      case 'week':
        filteredLogs = weightLogs.filter(log => {
          const day = normalize(log.recordedAt)
          return day >= subDays(today, 7) && day <= today
        })
        break
      case 'month':
        filteredLogs = weightLogs.filter(log => {
          const day = normalize(log.recordedAt)
          const start = subMonths(today, 1)
          return day >= start && day <= today
        })
        break
      case 'year':
        filteredLogs = weightLogs.filter(log => {
          const day = normalize(log.recordedAt)
          const start = subYears(today, 1)
          return day >= start && day <= today
        })
        break
      case 'all':
        filteredLogs = weightLogs
        break
    }

    let data: Array<{ label: string; fullDate: string; weight: number; timestamp: number; goalProjection?: number; weekdayTrend?: number }> = []

    if (period === 'week') {
      // Mostrar cada medição
      data = filteredLogs
        .map(log => ({
          label: `${format(asDate(log.recordedAt), 'EEE', { locale: ptBR })} ${format(asDate(log.recordedAt), 'dd/MM', { locale: ptBR })}`,
          fullDate: format(asDate(log.recordedAt), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR }),
          weight: log.weight,
          timestamp: asDate(log.recordedAt).getTime()
        }))
        .reverse()
    } else if (period === 'month') {
      // Média por dia
      const dayGroups = new Map<number, number[]>()
      filteredLogs.forEach(log => {
        const dayDate = normalize(log.recordedAt)
        const key = dayDate.getTime()
        if (!dayGroups.has(key)) {
          dayGroups.set(key, [])
        }
        dayGroups.get(key)!.push(log.weight)
      })

      data = Array.from(dayGroups.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([ms, weights]) => {
          const dayDate = new Date(ms)
          return {
            label: `${format(dayDate, 'EEE', { locale: ptBR })} ${format(dayDate, 'dd/MM', { locale: ptBR })}`,
            fullDate: format(dayDate, "EEEE, dd 'de' MMMM", { locale: ptBR }),
            weight: weights.reduce((a, b) => a + b, 0) / weights.length,
            timestamp: ms
          }
        })
    } else if (period === 'year') {
      // Média por semana
      const weekGroups = new Map<string, number[]>()
      filteredLogs.forEach(log => {
        const weekStart = startOfWeek(normalize(log.recordedAt), { locale: ptBR })
        const key = weekStart.getTime()
        if (!weekGroups.has(key)) {
          weekGroups.set(key, [])
        }
        weekGroups.get(key)!.push(log.weight)
      })

      data = Array.from(weekGroups.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([ms, weights]) => ({
          label: format(new Date(ms), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(ms), "dd 'de' MMMM", { locale: ptBR }),
          weight: weights.reduce((a, b) => a + b, 0) / weights.length,
          timestamp: ms
        }))
    } else {
      // Média por mês
      const monthGroups = new Map<string, number[]>()
      filteredLogs.forEach(log => {
        const monthStart = startOfMonth(normalize(log.recordedAt))
        const key = monthStart.getTime()
        if (!monthGroups.has(key)) {
          monthGroups.set(key, [])
        }
        monthGroups.get(key)!.push(log.weight)
      })

      data = Array.from(monthGroups.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([ms, weights]) => ({
          label: format(new Date(ms), 'MMM/yy', { locale: ptBR }),
          fullDate: format(new Date(ms), "MMMM 'de' yyyy", { locale: ptBR }),
          weight: weights.reduce((a, b) => a + b, 0) / weights.length,
          timestamp: ms
        }))
    }

    // Projeção linear até a meta
    if (weightStats?.goalTarget && weightStats.goalDate && data.length > 0) {
      const startWeight = data[0].weight
      const startTime = data[0].timestamp
      const goalTime = new Date(weightStats.goalDate).getTime()
      const span = goalTime - startTime
      if (span !== 0) {
        data = data.map(point => {
          const clamped = Math.min(Math.max(point.timestamp, startTime), goalTime)
          const projected = startWeight + (weightStats.goalTarget! - startWeight) * ((clamped - startTime) / span)
          return { ...point, goalProjection: projected }
        })
      }
    }

    // Tendência por dia da semana (usa média histórica daquele dia)
    if (data.length > 0) {
      data = data.map(point => {
        const weekday = new Date(point.timestamp).getDay()
        const weekdayTrend = weekdayAverages[weekday]
        return { ...point, weekdayTrend }
      })
    }

    return data
  }, [weightLogs, period, weightStats?.goalDate, weightStats?.goalTarget])

  if (weightLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Peso</CardTitle>
          <CardDescription>Nenhum registro ainda</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Evolução do Peso</CardTitle>
            <CardDescription>Acompanhe seu progresso ao longo do tempo</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={period === 'week' ? 'default' : 'outline'}
              onClick={() => setPeriod('week')}
              className="flex-1 sm:flex-none"
            >
              Semana
            </Button>
            <Button
              size="sm"
              variant={period === 'month' ? 'default' : 'outline'}
              onClick={() => setPeriod('month')}
              className="flex-1 sm:flex-none"
            >
              Mês
            </Button>
            <Button
              size="sm"
              variant={period === 'year' ? 'default' : 'outline'}
              onClick={() => setPeriod('year')}
              className="flex-1 sm:flex-none"
            >
              Ano
            </Button>
            <Button
              size="sm"
              variant={period === 'all' ? 'default' : 'outline'}
              onClick={() => setPeriod('all')}
              className="flex-1 sm:flex-none"
            >
              Total
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                domain={['dataMin - 2', 'dataMax + 2']}
                width={40}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} kg`, name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload.fullDate || ''}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                name="Peso"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              {chartData.some(point => point.weekdayTrend !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="weekdayTrend"
                  name="Tendência por dia"
                  stroke="#f97316"
                  strokeDasharray="4 6"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  opacity={0.9}
                />
              )}
              {weightStats?.goalTarget && weightStats.goalDate && (
                <Line
                  type="monotone"
                  dataKey="goalProjection"
                  name="Projeção para meta"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              {weightStats?.goalTarget && (
                <ReferenceLine
                  y={weightStats.goalTarget}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="4 4"
                  label={{ value: `Meta: ${weightStats.goalTarget} kg`, position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
