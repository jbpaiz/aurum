'use client'

import type { HealthInsight } from '@/types/health'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface InsightsCardProps {
  insights: HealthInsight[]
}

export function InsightsCard({ insights }: InsightsCardProps) {
  if (insights.length === 0) return null

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
      case 'warning': return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
      default: return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Insights</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, idx) => (
          <Card key={idx} className={`${getBgColor(insight.severity || 'info')} border`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getIcon(insight.severity || 'info')}
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
