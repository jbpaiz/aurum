'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealth } from '@/contexts/health-context'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfWeek, startOfMonth, startOfYear, subDays, subMonths, subYears, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'

type Period = 'month' | 'quarter' | 'year' | 'all'
type MeasurementType = 'waist' | 'hips' | 'chest' | 'arms' | 'thighs' | 'bodyFat'

export function BodyMeasurementsChart() {
  const { bodyMeasurements } = useHealth()
  const [period, setPeriod] = useState<Period>('quarter')
  const [measurementType, setMeasurementType] = useState<MeasurementType>('waist')

  const chartData = useMemo(() => {
    if (bodyMeasurements.length === 0) return []

    // Filter by period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'month':
        startDate = subDays(now, 30)
        break
      case 'quarter':
        startDate = subMonths(now, 3)
        break
      case 'year':
        startDate = subYears(now, 1)
        break
      case 'all':
        startDate = new Date(bodyMeasurements[bodyMeasurements.length - 1].measurementDate)
        break
    }

    const filteredMeasurements = bodyMeasurements
      .filter(m => new Date(m.measurementDate) >= startDate)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

    // Format data based on measurement type
    return filteredMeasurements.map(m => {
      const dataPoint: any = {
        date: m.measurementDate,
        displayDate: format(new Date(m.measurementDate), "dd/MM/yy")
      }

      switch (measurementType) {
        case 'waist':
          dataPoint.cintura = m.waist
          break
        case 'hips':
          dataPoint.quadril = m.hips
          break
        case 'chest':
          dataPoint.peitoral = m.chest
          break
        case 'arms':
          dataPoint.bracoEsq = m.armLeft
          dataPoint.bracoDir = m.armRight
          break
        case 'thighs':
          dataPoint.coxaEsq = m.thighLeft
          dataPoint.coxaDir = m.thighRight
          break
        case 'bodyFat':
          dataPoint.gorduraCorporal = m.bodyFatPercentage
          dataPoint.massaMuscular = m.muscleMass
          break
      }

      return dataPoint
    })
  }, [bodyMeasurements, period, measurementType])

  const getLines = () => {
    switch (measurementType) {
      case 'waist':
        return [{ dataKey: 'cintura', name: 'Cintura', stroke: '#8b5cf6', unit: 'cm' }]
      case 'hips':
        return [{ dataKey: 'quadril', name: 'Quadril', stroke: '#ec4899', unit: 'cm' }]
      case 'chest':
        return [{ dataKey: 'peitoral', name: 'Peitoral', stroke: '#f59e0b', unit: 'cm' }]
      case 'arms':
        return [
          { dataKey: 'bracoEsq', name: 'Braço Esquerdo', stroke: '#3b82f6', unit: 'cm' },
          { dataKey: 'bracoDir', name: 'Braço Direito', stroke: '#06b6d4', unit: 'cm' }
        ]
      case 'thighs':
        return [
          { dataKey: 'coxaEsq', name: 'Coxa Esquerda', stroke: '#10b981', unit: 'cm' },
          { dataKey: 'coxaDir', name: 'Coxa Direita', stroke: '#84cc16', unit: 'cm' }
        ]
      case 'bodyFat':
        return [
          { dataKey: 'gorduraCorporal', name: 'Gordura Corporal', stroke: '#ef4444', unit: '%' },
          { dataKey: 'massaMuscular', name: 'Massa Muscular', stroke: '#22c55e', unit: 'kg' }
        ]
    }
  }

  if (bodyMeasurements.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle>Evolução das Medidas</CardTitle>
              <CardDescription>Acompanhe as mudanças ao longo do tempo</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={measurementType} onValueChange={(value) => setMeasurementType(value as MeasurementType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waist">Cintura</SelectItem>
                <SelectItem value="hips">Quadril</SelectItem>
                <SelectItem value="chest">Peitoral</SelectItem>
                <SelectItem value="arms">Braços</SelectItem>
                <SelectItem value="thighs">Coxas</SelectItem>
                <SelectItem value="bodyFat">Gordura/Massa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="quarter">Últimos 3 Meses</SelectItem>
                <SelectItem value="year">Último Ano</SelectItem>
                <SelectItem value="all">Todo Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
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
                    return format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  }
                  return label
                }}
              />
              <Legend />
              {getLines().map(line => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  name={`${line.name} (${line.unit})`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
