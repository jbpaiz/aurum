'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfDay, addDays } from 'date-fns'
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
          return day >= subYears(today, 1)
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
      goalLine?: number
      trendProjection?: number
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
      // Modo "Meta" (all): Mostrar todos os registros individuais para cálculo preciso da tendência
      data = filteredLogs
        .map(log => ({
          label: format(asDate(log.recordedAt), 'dd/MM', { locale: ptBR }),
          fullDate: format(asDate(log.recordedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          weight: log.weight,
          timestamp: asDate(log.recordedAt).getTime()
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
    }

    // Se temos meta definida, calcular as 3 linhas
    if (weightStats?.goalTarget && weightStats.goalDate && data.length > 0) {
      const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp)
      const startWeight = sorted[0].weight ?? 0
      const startTime = sorted[0].timestamp
      const goalTime = new Date(weightStats.goalDate).getTime()
      const goalWeight = weightStats.goalTarget

      // 1. LINHA DA META: do peso inicial até o peso da meta na data da meta
      const goalSpan = goalTime - startTime
      
      // 2. REGRESSÃO LINEAR: calcular tendência baseada nos dados atuais
      const weightsOnly = sorted.map(p => p.weight ?? 0)
      const timestamps = sorted.map(p => p.timestamp)
      
      // Calcular média
      const xMean = timestamps.reduce((a, b) => a + b, 0) / timestamps.length
      const yMean = weightsOnly.reduce((a, b) => a + b, 0) / weightsOnly.length
      
      // Calcular slope (inclinação) e intercept
      let numerator = 0
      let denominator = 0
      for (let i = 0; i < timestamps.length; i++) {
        const dx = timestamps[i] - xMean
        numerator += dx * (weightsOnly[i] - yMean)
        denominator += dx * dx
      }
      const slope = denominator !== 0 ? numerator / denominator : 0
      const intercept = yMean - slope * xMean

      // Calcular data estimada de atingimento da meta
      const estimatedTimestamp = Math.abs(slope) > 0.000001 
        ? (goalWeight - intercept) / slope 
        : goalTime
      
      // Verificar se está indo na direção certa
      const currentWeight = weightsOnly[weightsOnly.length - 1]
      const isGainingWeight = slope > 0
      const needsToGain = goalWeight > currentWeight
      const isWrongDirection = isGainingWeight !== needsToGain

      // Aplicar as linhas aos pontos existentes
      data = sorted.map(point => {
        // Linha da meta (linear do início até a meta na data alvo)
        let goalLine: number | undefined
        if (goalSpan !== 0 && point.timestamp <= goalTime) {
          const progress = (point.timestamp - startTime) / goalSpan
          goalLine = startWeight + (goalWeight - startWeight) * progress
        } else if (point.timestamp > goalTime) {
          // Após a data da meta, manter o peso da meta constante
          goalLine = goalWeight
        }

        // Linha de tendência (regressão linear)
        const trendProjection = intercept + slope * point.timestamp

        return {
          ...point,
          goalLine,
          trendProjection
        }
      })

      // Se estamos no modo "Meta" (all), adicionar pontos futuros até a data estimada
      if (period === 'all' && !isWrongDirection) {
        const lastDataTime = sorted[sorted.length - 1].timestamp
        let finalTime = estimatedTimestamp
        
        // Limitar a projeção se for muito distante
        if (estimatedTimestamp > goalTime + (365 * 24 * 60 * 60 * 1000)) {
          finalTime = goalTime + (90 * 24 * 60 * 60 * 1000) // 3 meses após a meta
        }
        
        // Se a data estimada é futura, adicionar pontos
        if (finalTime > lastDataTime) {
          const dayMs = 24 * 60 * 60 * 1000
          const daysToFinal = Math.ceil((finalTime - lastDataTime) / dayMs)
          
          // Adicionar pontos intermediários (a cada 3 dias para ter mais precisão nos marcadores)
          const pointsToAdd = Math.ceil(daysToFinal / 3)
          const interval = (finalTime - lastDataTime) / pointsToAdd
          
          for (let i = 1; i <= pointsToAdd; i++) {
            const futureTime = lastDataTime + interval * i
            const futureDate = new Date(futureTime)
            
            // Linha da meta
            let goalLine: number | undefined
            if (futureTime <= goalTime) {
              const progress = (futureTime - startTime) / goalSpan
              goalLine = startWeight + (goalWeight - startWeight) * progress
            } else {
              goalLine = goalWeight
            }
            
            // Projeção de tendência (continua a regressão linear normalmente)
            const trendProjection = intercept + slope * futureTime
            
            data.push({
              label: format(futureDate, 'dd/MM', { locale: ptBR }),
              fullDate: format(futureDate, "dd 'de' MMMM", { locale: ptBR }),
              weight: null,
              timestamp: futureTime,
              goalLine,
              trendProjection
            })
          }
        }
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
                    <strong>Peso Atual:</strong> Linha sólida azul com pontos mostrando seus dados reais até hoje
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    <strong>Meta:</strong> Linha verde tracejada conectando seu peso inicial até o peso da meta na data alvo
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
                    <strong>Tendência:</strong> Linha laranja tracejada mostrando a projeção futura baseada na sua evolução atual (regressão linear)
                  </p>
                  <p className="text-xs mt-4 text-foreground">
                    💡 <strong>Dica:</strong> Compare a linha de tendência (laranja) com a linha da meta (verde) para saber se você está no caminho certo!
                  </p>
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
              Meta
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
                tickFormatter={(value: number) => value.toFixed(1)}
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
              
              {/* Linha 1: Peso Atual (dados reais até hoje) */}
              <Line
                type="monotone"
                dataKey="weight"
                name="Peso Atual"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              
              {/* Linha 2: Meta (peso inicial até peso da meta na data da meta) */}
              {weightStats?.goalTarget && weightStats.goalDate && (
                <Line
                  type="monotone"
                  dataKey="goalLine"
                  name="Meta"
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={(props: any) => {
                    // Mostrar marcador apenas no primeiro ponto que atinge a meta
                    const goalValue = props.payload.goalLine
                    if (!goalValue || !weightStats.goalTarget) return null
                    
                    // Verifica se está próximo ao peso da meta (tolerância de 0.5kg)
                    const isAtGoal = Math.abs(goalValue - weightStats.goalTarget) < 0.5
                    if (!isAtGoal) return null
                    
                    // Verificar se é o primeiro ponto que atinge a meta
                    const currentIndex = props.index
                    if (currentIndex > 0) {
                      const prevValue = chartData[currentIndex - 1]?.goalLine
                      if (prevValue && Math.abs(prevValue - weightStats.goalTarget) < 0.5) {
                        return null // Já teve um marcador antes
                      }
                    }
                    
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#22c55e"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )
                  }}
                  connectNulls
                />
              )}
              
              {/* Linha 3: Tendência (regressão linear projetando até a data da meta) */}
              {weightStats?.goalTarget && weightStats.goalDate && (
                <Line
                  type="monotone"
                  dataKey="trendProjection"
                  name="Tendência"
                  stroke="#f97316"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  dot={(props: any) => {
                    // Mostrar marcador apenas no primeiro ponto que atinge a meta
                    const trendValue = props.payload.trendProjection
                    if (!trendValue || !weightStats.goalTarget) return null
                    
                    // Verifica se está próximo ao peso da meta (tolerância de 0.5kg)
                    const isAtGoal = Math.abs(trendValue - weightStats.goalTarget) < 0.5
                    if (!isAtGoal) return null
                    
                    // Verificar se é o primeiro ponto que atinge a meta
                    const currentIndex = props.index
                    if (currentIndex > 0) {
                      const prevValue = chartData[currentIndex - 1]?.trendProjection
                      if (prevValue && Math.abs(prevValue - weightStats.goalTarget) < 0.5) {
                        return null // Já teve um marcador antes
                      }
                    }
                    
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    )
                  }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}