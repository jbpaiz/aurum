'use client'

import { useMemo, useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = 'week' | 'month' | 'year' | 'all'

export function ActivityChart() {
  const { activities } = useHealth()
  const [period, setPeriod] = useState<Period>('month')

  const safeDate = (iso: string) => {
    if (!iso) return new Date('')
    // Accepts 'yyyy-MM-dd' or 'yyyy-MM' formats
    const parts = iso.split('-').map(Number)
    if (parts.length === 3) {
      const [y, m, d] = parts
      return new Date(y, m - 1, d)
    }
    const [y, m] = parts
    return new Date(y, m - 1, 1)
  }

  const chartData = useMemo(() => {
    if (activities.length === 0) return []

    const now = new Date()
    let filteredActivities = activities

    // Filtrar por período
    switch (period) {
      case 'week':
        filteredActivities = activities.filter(a => 
          safeDate(a.activityDate) >= subDays(now, 7)
        )
        break
      case 'month':
        filteredActivities = activities.filter(a => 
          safeDate(a.activityDate) >= subMonths(now, 1)
        )
        break
      case 'year':
        filteredActivities = activities.filter(a => 
          safeDate(a.activityDate) >= subYears(now, 1)
        )
        break
      case 'all':
        filteredActivities = activities
        break
    }

    // Agrupar dados conforme período
    if (period === 'week') {
      // Por dia
      const dayGroups = new Map<string, { duration: number, calories: number, ts: number }>()
      filteredActivities.forEach(a => {
        const day = format(safeDate(a.activityDate), 'yyyy-MM-dd')
        if (!dayGroups.has(day)) {
          dayGroups.set(day, { duration: 0, calories: 0, ts: safeDate(day).getTime() })
        }
        const group = dayGroups.get(day)!
        group.duration += a.durationMinutes
        group.calories += a.caloriesBurned || 0
      })

      return Array.from(dayGroups.entries())
        .map(([day, data]) => ({
          date: format(safeDate(day), 'dd/MM', { locale: ptBR }),
          fullDate: format(safeDate(day), "dd 'de' MMMM", { locale: ptBR }),
          duration: data.duration,
          calories: data.calories,
          ts: data.ts
        }))
        .sort((a, b) => a.ts - b.ts)
    } else if (period === 'month') {
      // Por dia
      const dayGroups = new Map<string, { duration: number, calories: number, ts: number }>()
      filteredActivities.forEach(a => {
        const day = format(safeDate(a.activityDate), 'yyyy-MM-dd')
        if (!dayGroups.has(day)) {
          dayGroups.set(day, { duration: 0, calories: 0, ts: safeDate(day).getTime() })
        }
        const group = dayGroups.get(day)!
        group.duration += a.durationMinutes
        group.calories += a.caloriesBurned || 0
      })

      return Array.from(dayGroups.entries())
        .map(([day, data]) => ({
          date: format(safeDate(day), 'dd/MM', { locale: ptBR }),
          fullDate: format(safeDate(day), "dd 'de' MMMM", { locale: ptBR }),
          duration: data.duration,
          calories: data.calories,
          ts: data.ts
        }))
        .sort((a, b) => a.ts - b.ts)
    } else if (period === 'year') {
      // Por semana
      const weekGroups = new Map<string, { duration: number, calories: number, ts: number }>()
      filteredActivities.forEach(a => {
        const weekStart = startOfWeek(safeDate(a.activityDate), { locale: ptBR })
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, { duration: 0, calories: 0, ts: safeDate(weekKey).getTime() })
        }
        const group = weekGroups.get(weekKey)!
        group.duration += a.durationMinutes
        group.calories += a.caloriesBurned || 0
      })

      return Array.from(weekGroups.entries())
        .map(([week, data]) => ({
          date: format(safeDate(week), 'dd/MM', { locale: ptBR }),
          fullDate: format(safeDate(week), "dd 'de' MMMM", { locale: ptBR }),
          duration: data.duration,
          calories: data.calories,
          ts: data.ts
        }))
        .sort((a, b) => a.ts - b.ts)
    } else {
      // Por mês
      const monthGroups = new Map<string, { duration: number, calories: number, ts: number }>()
      filteredActivities.forEach(a => {
        const monthStart = startOfMonth(safeDate(a.activityDate))
        const monthKey = format(monthStart, 'yyyy-MM')
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, { duration: 0, calories: 0, ts: safeDate(monthKey + '-01').getTime() })
        }
        const group = monthGroups.get(monthKey)!
        group.duration += a.durationMinutes
        group.calories += a.caloriesBurned || 0
      })

      return Array.from(monthGroups.entries())
        .map(([month, data]) => ({
          date: format(safeDate(month + '-01'), 'MMM/yy', { locale: ptBR }),
          fullDate: format(safeDate(month + '-01'), "MMMM 'de' yyyy", { locale: ptBR }),
          duration: data.duration,
          calories: data.calories,
          ts: data.ts
        }))
        .sort((a, b) => a.ts - b.ts)
    }
  }, [activities, period])

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Atividades</CardTitle>
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
            <CardTitle>Evolução das Atividades</CardTitle>
            <CardDescription>Acompanhe sua performance ao longo do tempo</CardDescription>
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
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
                width={40}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                width={40}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  name === 'duration' ? `${value} min` : `${value} kcal`,
                  name === 'duration' ? 'Duração' : 'Calorias'
                ]}
                labelFormatter={(label: string) => {
                  const data = chartData.find(d => d.date === label)
                  return data ? data.fullDate : label
                }}
              />
              <Legend 
                formatter={(value) => value === 'duration' ? 'Duração' : 'Calorias'}
              />
              <Bar 
                yAxisId="left"
                dataKey="duration" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="calories" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
