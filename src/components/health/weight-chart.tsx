'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth, startOfYear, isSameWeek, isSameMonth, isSameYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'week' | 'month' | 'year' | 'all'

export function WeightChart() {
  const { weightLogs } = useHealth()
  const [period, setPeriod] = useState<Period>('month')

  const chartData = useMemo(() => {
    if (weightLogs.length === 0) return []

    const now = new Date()
    let filteredLogs = weightLogs

    // Filtrar por período
    switch (period) {
      case 'week':
        filteredLogs = weightLogs.filter(log => 
          new Date(log.recordedAt) >= subDays(now, 7)
        )
        break
      case 'month':
        filteredLogs = weightLogs.filter(log => 
          new Date(log.recordedAt) >= subMonths(now, 1)
        )
        break
      case 'year':
        filteredLogs = weightLogs.filter(log => 
          new Date(log.recordedAt) >= subYears(now, 1)
        )
        break
      case 'all':
        filteredLogs = weightLogs
        break
    }

    // Agrupar dados conforme período
    if (period === 'week') {
      // Mostrar cada medição
      return filteredLogs
        .map(log => ({
          date: format(new Date(log.recordedAt), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(log.recordedAt), "dd/MM 'às' HH:mm", { locale: ptBR }),
          weight: log.weight
        }))
        .reverse()
    } else if (period === 'month') {
      // Média por dia
      const dayGroups = new Map<string, number[]>()
      filteredLogs.forEach(log => {
        const day = format(new Date(log.recordedAt), 'yyyy-MM-dd')
        if (!dayGroups.has(day)) {
          dayGroups.set(day, [])
        }
        dayGroups.get(day)!.push(log.weight)
      })

      return Array.from(dayGroups.entries())
        .map(([day, weights]) => ({
          date: format(new Date(day), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(day), "dd 'de' MMMM", { locale: ptBR }),
          weight: weights.reduce((a, b) => a + b, 0) / weights.length
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    } else if (period === 'year') {
      // Média por semana
      const weekGroups = new Map<string, number[]>()
      filteredLogs.forEach(log => {
        const weekStart = startOfWeek(new Date(log.recordedAt), { locale: ptBR })
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, [])
        }
        weekGroups.get(weekKey)!.push(log.weight)
      })

      return Array.from(weekGroups.entries())
        .map(([week, weights]) => ({
          date: format(new Date(week), 'dd/MM', { locale: ptBR }),
          fullDate: format(new Date(week), "dd 'de' MMMM", { locale: ptBR }),
          weight: weights.reduce((a, b) => a + b, 0) / weights.length
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    } else {
      // Média por mês
      const monthGroups = new Map<string, number[]>()
      filteredLogs.forEach(log => {
        const monthStart = startOfMonth(new Date(log.recordedAt))
        const monthKey = format(monthStart, 'yyyy-MM')
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, [])
        }
        monthGroups.get(monthKey)!.push(log.weight)
      })

      return Array.from(monthGroups.entries())
        .map(([month, weights]) => ({
          date: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
          fullDate: format(new Date(month + '-01'), "MMMM 'de' yyyy", { locale: ptBR }),
          weight: weights.reduce((a, b) => a + b, 0) / weights.length
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }
  }, [weightLogs, period])

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
                dataKey="date" 
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
                formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                labelFormatter={(label: string) => {
                  const data = chartData.find(d => d.date === label)
                  return data ? data.fullDate : label
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
