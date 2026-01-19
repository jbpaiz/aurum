'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Eye, EyeOff, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'week' | 'month' | 'year' | 'all'

export function WeightChart() {
  const { weightLogs, weightStats } = useHealth()
  const [period, setPeriod] = useState<Period>('month')
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    Object.keys(weekdayBuckets)
      .map(key => Number(key))
      .forEach(key => {
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
      case 'all':
        filteredLogs = weightLogs
        break
    }

    let data: Array<{
      label: string
      fullDate: string
      weight: number | null
      timestamp: number
      goalProjection?: number
      weekdaySeasonal?: number
      emaShort?: number
      emaLong?: number
      projection7d?: number
    }> = []

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
        const key = String(weekStart.getTime())
        if (!weekGroups.has(key)) {
          weekGroups.set(key, [])
        }
        weekGroups.get(key)!.push(log.weight)
      })

      data = Array.from(weekGroups.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([ms, weights]) => {
          const weekStart = new Date(Number(ms))
          const weekLabel = `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(addDays(weekStart, 6), 'dd/MM', { locale: ptBR })}`
          return {
            label: weekLabel,
            fullDate: `Semana de ${format(weekStart, "dd 'de' MMMM", { locale: ptBR })}`,
            weight: weights.reduce((a, b) => a + b, 0) / weights.length,
            timestamp: Number(ms)
          }
        })
    } else {
      // Média por mês
      const monthGroups = new Map<number, number[]>()
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
            label: format(new Date(ms), 'MMM', { locale: ptBR }),
            fullDate: format(new Date(ms), "MMMM 'de' yyyy", { locale: ptBR }),
            weight: weights.reduce((a, b) => a + b, 0) / weights.length,
            timestamp: ms
          }))
    }

    // Tendências e projeção curta
    if (data.length > 0) {
      const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp)
      const ema = (series: number[], alpha: number) => {
        const out: number[] = []
        series.forEach((v, i) => {
          if (i === 0) out.push(v)
          else out.push(alpha * v + (1 - alpha) * out[i - 1])
        })
        return out
      }

      const weightsOnly = sorted.map(p => p.weight ?? 0)
      const emaShortSeries = ema(weightsOnly, 2 / (10 + 1))
      const emaLongSeries = ema(weightsOnly, 2 / (30 + 1))

      const globalMean =
        weightsOnly.reduce((a, b) => a + b, 0) / Math.max(1, weightsOnly.length)

      const weekdayRecent: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
      filteredLogs
        .slice()
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .forEach(log => {
          const wd = asDate(log.recordedAt).getDay()
          weekdayRecent[wd].push(log.weight)
        })
      const weekdayOffset: Record<number, number | undefined> = { 0: undefined, 1: undefined, 2: undefined, 3: undefined, 4: undefined, 5: undefined, 6: undefined }
      Object.keys(weekdayRecent).map(k => Number(k)).forEach(k => {
        const bucket = weekdayRecent[k]
        const recent = bucket.slice(-8)
        if (recent.length > 0) {
          const avg = recent.reduce((a, b) => a + b, 0) / recent.length
          weekdayOffset[k] = avg - globalMean
        }
      })

      const dayMs = 24 * 60 * 60 * 1000
      const lastTs = sorted[sorted.length - 1].timestamp
      const regressionWindowStart = lastTs - 30 * dayMs
      const regPoints = sorted.filter(p => p.timestamp >= regressionWindowStart)
      let slope = 0
      let intercept = sorted[sorted.length - 1].weight ?? 0
      if (regPoints.length >= 2) {
        const xs = regPoints.map(p => p.timestamp)
        const ys = regPoints.map(p => p.weight ?? 0)
        const xMean = xs.reduce((a, b) => a + b, 0) / xs.length
        const yMean = ys.reduce((a, b) => a + b, 0) / ys.length
        let num = 0
        let den = 0
        for (let i = 0; i < xs.length; i++) {
          const dx = xs[i] - xMean
          num += dx * (ys[i] - yMean)
          den += dx * dx
        }
        slope = den !== 0 ? num / den : 0
        intercept = yMean - slope * xMean
      }

      const enhanced = sorted.map((point, idx) => {
        const emaShort = emaShortSeries[idx]
        const emaLong = emaLongSeries[idx]
        const weekday = new Date(point.timestamp).getDay()
        const seasonal = weekdayOffset[weekday] ?? 0
        const weekdaySeasonal = (emaLong ?? point.weight ?? 0) + seasonal
        return {
          ...point,
          emaShort,
          emaLong,
          weekdaySeasonal,
          projection7d: intercept + slope * point.timestamp
        }
      })

      const futureTs = lastTs + 7 * dayMs
      const futureDate = new Date(futureTs)
      const futureWeekday = futureDate.getDay()
      const seasonal = weekdayOffset[futureWeekday] ?? 0
      const futureProjection = intercept + slope * futureTs + seasonal

      const futurePoint = {
        label: `${format(futureDate, 'EEE', { locale: ptBR })} ${format(futureDate, 'dd/MM', { locale: ptBR })}`,
        fullDate: format(futureDate, "EEEE, dd 'de' MMMM", { locale: ptBR }),
        weight: null,
        timestamp: futureTs,
        projection7d: futureProjection,
        weekdaySeasonal: (emaLongSeries[emaLongSeries.length - 1] ?? weightsOnly[weightsOnly.length - 1]) + seasonal,
        emaShort: undefined,
        emaLong: undefined,
        goalProjection: undefined
      }

      data = [...enhanced, futurePoint]
    }

    // Projeção linear até a meta
    if (weightStats?.goalTarget && weightStats.goalDate && data.length > 0) {
      const startWeight = data[0].weight ?? 0
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Evolução do Peso</CardTitle>
              <CardDescription>Acompanhe seu progresso ao longo do tempo</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Abrir legenda do gráfico">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Legenda do gráfico</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    Peso: pontos e linha sólida principal. Meta: linha vermelha tracejada horizontal.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
                    Projeção para meta: linha cinza tracejada ligada à data alvo informada.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
                    Tendência curta (EMA10): linha azul clara; Tendência longa (EMA30): linha cinza tracejada (visão detalhada).
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
                    Sazonal semanal: linha laranja tracejada, ajusta pela rotina de dias da semana (visão detalhada).
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    Projeção +7d: linha verde tracejada, prolonga tendência recente (visão detalhada).
                  </p>
                  <p className="text-xs">Use o ícone do olho para alternar entre visão limpa (peso + meta) e visão completa.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
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
            <Button
              size="sm"
              variant={showAdvanced ? 'default' : 'outline'}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex-1 sm:flex-none"
              title={showAdvanced ? 'Mostrar menos linhas' : 'Mostrar todas as linhas'}
            >
              {showAdvanced ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="sr-only">Alternar detalhes</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 12, bottom: 5 }}>
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
              {showAdvanced && chartData.some(point => point.emaShort !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="emaShort"
                  name="Tendência curta (EMA10)"
                  stroke="#60a5fa"
                  strokeOpacity={0.9}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              {showAdvanced && chartData.some(point => point.emaLong !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="emaLong"
                  name="Tendência longa (EMA30)"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
              {showAdvanced && chartData.some(point => point.weekdaySeasonal !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="weekdaySeasonal"
                  name="Sazonal semanal"
                  stroke="#f97316"
                  strokeDasharray="4 6"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  opacity={0.9}
                />
              )}
              {showAdvanced && chartData.some(point => point.projection7d !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="projection7d"
                  name="Projeção +7d"
                  stroke="#22c55e"
                  strokeDasharray="5 7"
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
