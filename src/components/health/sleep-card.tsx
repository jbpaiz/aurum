'use client'

import { useMemo } from 'react'
import { Moon } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SLEEP_QUALITY_LABELS, SLEEP_QUALITY_ICONS } from '@/types/health'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SleepCardProps {
  detailed?: boolean
  onAddClick?: () => void
}

export function SleepCard({ detailed = false, onAddClick }: SleepCardProps) {
  const { sleepLogs, sleepStats } = useHealth()

  const recentLogs = useMemo(() => {
    return sleepLogs.slice(0, detailed ? 20 : 5)
  }, [sleepLogs, detailed])

  if (!sleepStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sono</span>
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </CardTitle>
          <CardDescription>Nenhum registro ainda</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const avgHours = Math.floor(sleepStats.avgDuration / 60)
  const avgMinutes = sleepStats.avgDuration % 60

  const getQualityEmoji = (quality: number) => {
    if (quality >= 2.5) return '😊'
    if (quality >= 2) return '😐'
    return '😴'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sono</span>
          {onAddClick && (
            <Button size="sm" variant="outline" onClick={onAddClick}>
              Adicionar
            </Button>
          )}
        </CardTitle>
        <CardDescription>Última semana</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Sleep */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{avgHours}</span>
              <span className="text-xl text-muted-foreground mb-1">h</span>
              {avgMinutes > 0 && (
                <>
                  <span className="text-2xl font-bold">{avgMinutes}</span>
                  <span className="text-lg text-muted-foreground mb-1">min</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Média de {sleepStats.totalNights} noites
          </p>
        </div>

        {/* Quality */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Qualidade</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getQualityEmoji(sleepStats.avgQuality)}</span>
            <span className="font-medium">
              {sleepStats.avgQuality >= 2.5 ? 'Boa' : sleepStats.avgQuality >= 2 ? 'Normal' : 'Ruim'}
            </span>
          </div>
        </div>

        {/* Best/Worst */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Melhor</p>
            <p className="text-sm font-medium">
              {Math.floor((sleepStats.bestNight || 0) / 60)}h {(sleepStats.bestNight || 0) % 60}min
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pior</p>
            <p className="text-sm font-medium">
              {Math.floor((sleepStats.worstNight || 0) / 60)}h {(sleepStats.worstNight || 0) % 60}min
            </p>
          </div>
        </div>

        {/* Recent Logs */}
        {detailed && recentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Histórico</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentLogs.map(log => {
                const hours = Math.floor(log.durationMinutes / 60)
                const minutes = log.durationMinutes % 60
                return (
                  <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {hours}h {minutes}min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.sleepDate), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                    {log.quality && (
                      <div className="flex items-center gap-1">
                        <span>{SLEEP_QUALITY_ICONS[log.quality]}</span>
                        <span className="text-xs text-muted-foreground">
                          {SLEEP_QUALITY_LABELS[log.quality]}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
