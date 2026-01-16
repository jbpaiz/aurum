'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useHealth } from '@/contexts/health-context'
import { Droplets } from 'lucide-react'
import { toast } from 'sonner'

interface HydrationQuickAddProps {
  onCustomClick: () => void
}

const QUICK_AMOUNTS = [
  { label: 'Copo', ml: 250, icon: '🥤' },
  { label: 'Garrafa', ml: 500, icon: '💧' },
  { label: 'Litro', ml: 1000, icon: '🚰' }
]

export function HydrationQuickAdd({ onCustomClick }: HydrationQuickAddProps) {
  const { createHydrationLog } = useHealth()

  const handleQuickAdd = async (ml: number, label: string) => {
    try {
      await createHydrationLog({ amountMl: ml })
      toast.success(`${label} (${ml}ml) registrado!`)
    } catch (error) {
      console.error('Erro ao registrar água:', error)
      toast.error('Erro ao registrar')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Registro Rápido</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {QUICK_AMOUNTS.map(({ label, ml, icon }) => (
            <Button
              key={ml}
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => handleQuickAdd(ml, label)}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{ml}ml</span>
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={onCustomClick}
        >
          Quantidade Personalizada
        </Button>
      </CardContent>
    </Card>
  )
}
