'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'week' | 'month' | 'year' | 'all'

const QUALITY_VALUES = {
  poor: 1,
  normal: 2,
  good: 3
}

export function SleepChart() {
  const { sleepLogs } = useHealth()
  const [period, setPeriod] = useState<Period>('month')

  const chartData = useMemo(() => {
    if (sleepLogs.length === 0) return []

    const now = new Date()
    let filteredLogs = sleepLogs

    // Filtrar por período
    switch (period) {
      case 'week':
        filteredLogs = sleepLogs.filter(log => 
          new Date(log.sleepDate) >= subDays(now, 7)
        )
        break
      case 'month':
        filteredLogs = sleepLogs.filter(log => 
          new Date(log.sleepDate) >= subMonths(now, 1)
        )
        break
      case 'year':
        filteredLogs = sleepLogs.filter(log => 
          new Date(log.sleepDate) >= subYears(now, 1)
        )
        break
      case 'all':
        filteredLogs = sleepLogs
        break
    }

    // Agrupar dados conforme período
    if (period === 'week' || period === 'month') {
      // Mostrar cada dia
      return filteredLogs
        .map(log => ({
          date: format(new Date(log.sleepDate), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(log.sleepDate), "dd 'de' MMMM", { locale: ptBR }),
          hours: log.durationMinutes / 60,
          quality: log.quality ? QUALITY_VALUES[log.quality] : 2
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    } else if (period === 'year') {
      // Média por semana
      const weekGroups = new Map<string, { durations: number[], qualities: number[] }>()
      filteredLogs.forEach(log => {
        const weekStart = startOfWeek(new Date(log.sleepDate), { locale: ptBR })
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, { durations: [], qualities: [] })
        }
        const group = weekGroups.get(weekKey)!
        group.durations.push(log.durationMinutes)
        group.qualities.push(log.quality ? QUALITY_VALUES[log.quality] : 2)
      })

      return Array.from(weekGroups.entries())
        .map(([week, data]) => ({
          date: format(new Date(week), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(week), "dd 'de' MMMM", { locale: ptBR }),
          hours: data.durations.reduce((a, b) => a + b, 0) / data.durations.length / 60,
          quality: data.qualities.reduce((a, b) => a + b, 0) / data.qualities.length
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    } else {
      // Média por mês
      const monthGroups = new Map<string, { durations: number[], qualities: number[] }>()
      filteredLogs.forEach(log => {
        const monthStart = startOfMonth(new Date(log.sleepDate))
        const monthKey = format(monthStart, 'yyyy-MM')
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, { durations: [], qualities: [] })
        }
        const group = monthGroups.get(monthKey)!
        group.durations.push(log.durationMinutes)
        group.qualities.push(log.quality ? QUALITY_VALUES[log.quality] : 2)
      })

      return Array.from(monthGroups.entries())
        .map(([month, data]) => ({
          date: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
          fullDate: format(new Date(month + '-01'), "MMMM 'de' yyyy", { locale: ptBR }),
          hours: data.durations.reduce((a, b) => a + b, 0) / data.durations.length / 60,
          quality: data.qualities.reduce((a, b) => a + b, 0) / data.qualities.length
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }
  }, [sleepLogs, period])

  if (sleepLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Sono</CardTitle>
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
            <CardTitle>Evolução do Sono</CardTitle>
            <CardDescription>Acompanhe a qualidade e duração do seu sono</CardDescription>
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
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                domain={[0, 12]}
                width={40}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 3]}
                ticks={[1, 2, 3]}
                tickFormatter={(value) => {
                  if (value === 1) return 'Ruim'
                  if (value === 2) return 'Normal'
                  if (value === 3) return 'Boa'
                  return ''
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'hours') {
                    return [`${value.toFixed(1)}h`, 'Duração']
                  }
                  const qualityText = value <= 1.5 ? 'Ruim' : value <= 2.5 ? 'Normal' : 'Boa'
                  return [qualityText, 'Qualidade']
                }}
                labelFormatter={(label: string) => {
                  const data = chartData.find(d => d.date === label)
                  return data ? data.fullDate : label
                }}
              />
              <Legend 
                formatter={(value) => value === 'hours' ? 'Duração' : 'Qualidade'}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="hours" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="quality" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
