'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useHealth } from '@/contexts/health-context'
import { Star, TrendingUp, Award } from 'lucide-react'

export function PointsDisplay() {
  const { userStats } = useHealth()

  if (!userStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">Comece sua jornada!</p>
            <p className="text-sm">
              Registre atividades de saúde para ganhar pontos e subir de nível
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalPoints, level, currentStreak, longestStreak } = userStats

  // Pontos necessários para o próximo nível (1000 pontos por nível)
  const pointsPerLevel = 1000
  const currentLevelPoints = (level - 1) * pointsPerLevel
  const nextLevelPoints = level * pointsPerLevel
  const progressPoints = totalPoints - currentLevelPoints
  const pointsNeeded = nextLevelPoints - totalPoints
  const progressPercent = (progressPoints / pointsPerLevel) * 100

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Nível e Pontos Totais */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-3 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{level}</div>
                <div className="text-xs">Nível</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{totalPoints.toLocaleString('pt-BR')} pontos</h3>
            <p className="text-sm text-muted-foreground">
              {pointsNeeded.toLocaleString('pt-BR')} pontos para o próximo nível
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nível {level}</span>
              <span className="text-muted-foreground">Nível {level + 1}</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="text-center text-xs text-muted-foreground">
              {progressPoints} / {pointsPerLevel} pontos ({Math.round(progressPercent)}%)
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sequência Atual</p>
                <p className="text-lg font-bold">{currentStreak} dias</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor Sequência</p>
                <p className="text-lg font-bold">{longestStreak} dias</p>
              </div>
            </div>
          </div>

          {/* Dica de como ganhar pontos */}
          <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg text-sm">
            <p className="font-medium mb-2">💡 Como ganhar pontos:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Desbloqueie conquistas: <span className="font-semibold text-foreground">+100 pontos</span></li>
              <li>• Complete desafios: <span className="font-semibold text-foreground">+50 a 500 pontos</span></li>
              <li>• Mantenha sequências diárias: <span className="font-semibold text-foreground">Bônus progressivo</span></li>
            </ul>
          </div>

          {/* Milestone do nível */}
          {level >= 10 && (
            <div className="p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-lg text-center">
              <Award className="h-8 w-8 mx-auto mb-1 text-yellow-600" />
              <p className="font-bold text-sm">
                {level >= 50 ? '👑 Mestre da Saúde!' : 
                 level >= 25 ? '🌟 Expert em Saúde!' : 
                 '⭐ Praticante Avançado!'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
