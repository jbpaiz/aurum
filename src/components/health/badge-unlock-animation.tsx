'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Trophy, X } from 'lucide-react'
import { BADGE_LABELS, BADGE_ICONS, type BadgeType } from '@/types/health'
import { Button } from '@/components/ui/button'

interface BadgeUnlockAnimationProps {
  badgeType: BadgeType
  onClose: () => void
}

export function BadgeUnlockAnimation({ badgeType, onClose }: BadgeUnlockAnimationProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => setAnimating(true), 200)

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setAnimating(false)
    setTimeout(onClose, 300)
  }

  const icon = BADGE_ICONS[badgeType]
  const label = BADGE_LABELS[badgeType]

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      <Card 
        className={`
          relative max-w-md w-full p-8 text-center
          bg-gradient-to-br from-yellow-50 to-yellow-100 
          dark:from-yellow-950 dark:to-yellow-900
          border-4 border-yellow-400 dark:border-yellow-600
          shadow-2xl
          transition-all duration-500
          ${animating ? 'scale-100 rotate-0' : 'scale-50 rotate-12'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Trophy icon with pulse animation */}
        <div className={`
          inline-flex items-center justify-center w-20 h-20 mb-4
          rounded-full bg-yellow-400 dark:bg-yellow-600
          ${animating ? 'animate-pulse' : ''}
        `}>
          <Trophy className="h-10 w-10 text-yellow-900 dark:text-yellow-100" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2 text-yellow-900 dark:text-yellow-100">
          🎉 Conquista Desbloqueada!
        </h2>

        {/* Badge icon and name */}
        <div className={`
          inline-block p-6 mb-4 rounded-2xl
          bg-white dark:bg-gray-800
          border-2 border-yellow-400 dark:border-yellow-600
          shadow-lg
          transition-transform duration-700
          ${animating ? 'scale-100' : 'scale-0'}
        `}>
          <div className="text-6xl mb-3">{icon}</div>
          <p className="text-xl font-bold">{label}</p>
        </div>

        {/* Points reward */}
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-yellow-900 dark:text-yellow-100">
          <span>+100 pontos</span>
          <span className="text-2xl">💎</span>
        </div>

        {/* Close hint */}
        <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-300">
          Clique em qualquer lugar para fechar
        </p>
      </Card>
    </div>
  )
}

// Hook para gerenciar fila de notificações de badges
export function useBadgeNotifications() {
  const [queue, setQueue] = useState<BadgeType[]>([])
  const [current, setCurrent] = useState<BadgeType | null>(null)

  const showBadge = (badgeType: BadgeType) => {
    setQueue(prev => [...prev, badgeType])
  }

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [current, queue])

  const handleClose = () => {
    setCurrent(null)
  }

  return {
    current,
    showBadge,
    handleClose
  }
}
