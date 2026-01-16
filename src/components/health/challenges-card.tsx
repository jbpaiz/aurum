'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/contexts/health-context'
import { Target, Trophy, Calendar, Coins } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CHALLENGE_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  '7_day_weight': { label: '7 Dias de Peso', emoji: '⚖️' },
  '7_day_activity': { label: '7 Dias Ativo', emoji: '🏃' },
  '7_day_hydration': { label: '7 Dias Hidratado', emoji: '💧' },
  'weekly_activity_hours': { label: 'Horas de Atividade Semanais', emoji: '⏱️' },
  'monthly_meals': { label: 'Refeições do Mês', emoji: '🍽️' },
  'sleep_quality_week': { label: 'Sono de Qualidade Semanal', emoji: '😴' }
}

export function ChallengesCard() {
  const { challenges } = useHealth()

  const activeChallenges = challenges.filter(c => c.status === 'active')
  const completedChallenges = challenges.filter(c => c.status === 'completed')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Desafios</CardTitle>
              <CardDescription>
                {activeChallenges.length} ativos • {completedChallenges.length} completos
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desafios Ativos */}
        {activeChallenges.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Desafios Ativos</h4>
            {activeChallenges.map((challenge) => {
              const typeInfo = CHALLENGE_TYPE_LABELS[challenge.challengeType] || { 
                label: challenge.challengeType, 
                emoji: '🎯' 
              }
              
              const progress = challenge.targetValue 
                ? Math.min(100, (challenge.currentValue / challenge.targetValue) * 100)
                : 0

              const daysLeft = differenceInDays(new Date(challenge.endDate), new Date())
              const isExpiringSoon = daysLeft <= 2

              return (
                <div 
                  key={challenge.id} 
                  className={`
                    p-4 border-2 rounded-lg transition-colors
                    ${isExpiringSoon 
                      ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">{typeInfo.emoji}</div>
                      <div>
                        <h5 className="font-semibold">{typeInfo.label}</h5>
                        <p className="text-xs text-muted-foreground">
                          {challenge.targetValue && (
                            <span>{challenge.currentValue} / {challenge.targetValue}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Coins className="h-4 w-4" />
                      <span className="font-semibold text-sm">{challenge.rewardPoints}</span>
                    </div>
                  </div>

                  {challenge.targetValue && (
                    <div className="space-y-1 mb-3">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(progress)}% completo
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>
                    {isExpiringSoon && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Expirando em breve!
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Desafios Completos Recentes */}
        {completedChallenges.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Completos Recentemente</h4>
            {completedChallenges.slice(0, 3).map((challenge) => {
              const typeInfo = CHALLENGE_TYPE_LABELS[challenge.challengeType] || { 
                label: challenge.challengeType, 
                emoji: '🎯' 
              }

              return (
                <div 
                  key={challenge.id} 
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-sm">{typeInfo.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Completo em {format(new Date(challenge.endDate), "d 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Coins className="h-4 w-4" />
                    <span className="font-semibold text-sm">+{challenge.rewardPoints}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Estado vazio */}
        {activeChallenges.length === 0 && completedChallenges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">Nenhum desafio ativo</p>
            <p className="text-sm mb-4">
              Desafios serão criados automaticamente baseados em suas atividades
            </p>
            <Button variant="outline" size="sm" disabled>
              <Trophy className="mr-2 h-4 w-4" />
              Em breve
            </Button>
          </div>
        )}

        {/* Dica sobre desafios */}
        {activeChallenges.length > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">💡 Sobre desafios:</p>
            <p className="text-muted-foreground">
              Complete desafios antes do prazo para ganhar pontos extras e subir de nível mais rápido!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
