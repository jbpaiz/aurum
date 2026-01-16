'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useHealth } from '@/contexts/health-context'
import { Trophy, Lock } from 'lucide-react'
import { BADGE_LABELS, BADGE_ICONS, type BadgeType } from '@/types/health'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ALL_BADGES: BadgeType[] = [
  'first_weight', 'weight_streak_7', 'weight_streak_30', 'weight_goal',
  'first_activity', 'activity_streak_7', 'activity_streak_30', 'activity_100h',
  'first_sleep', 'sleep_streak_7', 'sleep_streak_30', 'sleep_quality',
  'hydration_streak_7', 'hydration_streak_30',
  'meal_logged_100', 'balanced_week',
  'all_in_one_week', 'health_champion'
]

export function AchievementsCard() {
  const { badges } = useHealth()

  const earnedBadgeTypes = badges.map(b => b.badgeType)
  const earnedCount = badges.length
  const totalCount = ALL_BADGES.length
  const progress = (earnedCount / totalCount) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle>Conquistas</CardTitle>
              <CardDescription>
                {earnedCount} de {totalCount} conquistas desbloqueadas ({Math.round(progress)}%)
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {ALL_BADGES.map((badgeType) => {
            const badge = badges.find(b => b.badgeType === badgeType)
            const isEarned = !!badge
            const icon = BADGE_ICONS[badgeType]
            const label = BADGE_LABELS[badgeType]

            return (
              <div
                key={badgeType}
                className={`
                  relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                  ${isEarned 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 hover:scale-105' 
                    : 'border-gray-200 dark:border-gray-700 opacity-40 grayscale'
                  }
                `}
                title={isEarned && badge ? `Conquistado em ${format(new Date(badge.earnedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}` : 'Bloqueado'}
              >
                <div className="text-4xl mb-2">
                  {isEarned ? icon : <Lock className="h-8 w-8 text-gray-400" />}
                </div>
                <p className="text-xs font-medium text-center leading-tight">
                  {label}
                </p>
                {isEarned && badge && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(badge.earnedAt), 'd/MM/yy')}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {earnedCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">Nenhuma conquista ainda</p>
            <p className="text-sm">
              Continue registrando suas atividades de saúde para desbloquear conquistas!
            </p>
          </div>
        )}

        {earnedCount > 0 && earnedCount < totalCount && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">💡 Próximas conquistas:</p>
            <ul className="text-muted-foreground space-y-1">
              {!earnedBadgeTypes.includes('weight_streak_7') && (
                <li>• Registre peso por 7 dias consecutivos</li>
              )}
              {!earnedBadgeTypes.includes('activity_streak_7') && (
                <li>• Faça atividades por 7 dias consecutivos</li>
              )}
              {!earnedBadgeTypes.includes('hydration_streak_7') && (
                <li>• Registre hidratação por 7 dias consecutivos</li>
              )}
            </ul>
          </div>
        )}

        {earnedCount === totalCount && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
            <p className="font-bold text-lg">🎉 Parabéns!</p>
            <p className="text-sm text-muted-foreground">
              Você desbloqueou todas as conquistas!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
