'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealth } from '@/contexts/health-context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, startOfWeek, startOfMonth, subDays, subMonths, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'

type Period = 'week' | 'month' | 'quarter'

export function HydrationChart() {
  const { hydrationLogs, hydrationGoal } = useHealth()
  const [period, setPeriod] = useState<Period>('week')

  const chartData = useMemo(() => {
    if (hydrationLogs.length === 0) return []

    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = subDays(now, 7)
        break
      case 'month':
        startDate = subDays(now, 30)
        break
      case 'quarter':
        startDate = subMonths(now, 3)
        break
    }

    // Generate all dates in range
    const dates = eachDayOfInterval({ start: startDate, end: now })

    // Group logs by date
    const dailyTotals: Record<string, number> = {}
    hydrationLogs.forEach(log => {
      const date = log.logDate
      if (new Date(date) >= startDate) {
        dailyTotals[date] = (dailyTotals[date] || 0) + log.amountMl
      }
    })

    // Create chart data
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date: dateStr,
        displayDate: format(date, period === 'week' ? 'EEE' : 'dd/MM', { locale: ptBR }),
        amount: dailyTotals[dateStr] || 0,
        goal: hydrationGoal?.dailyGoalMl || 2000
      }
    })
  }, [hydrationLogs, hydrationGoal, period])

  const averageAmount = useMemo(() => {
    if (chartData.length === 0) return 0
    const total = chartData.reduce((sum, day) => sum + day.amount, 0)
    return Math.round(total / chartData.length)
  }, [chartData])

  const goalDays = useMemo(() => {
    return chartData.filter(day => day.amount >= day.goal).length
  }, [chartData])

  if (hydrationLogs.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Evolução da Hidratação</CardTitle>
              <CardDescription>
                Média: {averageAmount}ml/dia • {goalDays}/{chartData.length} dias com meta
              </CardDescription>
            </div>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Últimos 3 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'ml', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(label: any) => {
                  const item = chartData.find(d => d.displayDate === label)
                  if (item?.date) {
                    return format(new Date(item.date), "dd 'de' MMMM", { locale: ptBR })
                  }
                  return label
                }}
                formatter={(value: any) => [`${value}ml`, 'Consumo']}
              />
              <ReferenceLine 
                y={hydrationGoal?.dailyGoalMl || 2000} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="3 3"
                label={{ value: 'Meta', position: 'right', fill: 'currentColor', fontSize: 12 }}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(200 80% 50%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
