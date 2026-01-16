'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHealth } from '@/contexts/health-context'
import { toast } from 'sonner'

interface HydrationGoalModalProps {
  open: boolean
  onClose: () => void
}

export function HydrationGoalModal({ open, onClose }: HydrationGoalModalProps) {
  const { hydrationGoal, createOrUpdateHydrationGoal } = useHealth()
  const [dailyGoalMl, setDailyGoalMl] = useState('2000')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hydrationGoal) {
      setDailyGoalMl(hydrationGoal.dailyGoalMl.toString())
    }
  }, [hydrationGoal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const goal = parseFloat(dailyGoalMl)
    if (isNaN(goal) || goal <= 0) {
      toast.error('Informe uma meta válida')
      return
    }

    setLoading(true)

    try {
      await createOrUpdateHydrationGoal({ dailyGoalMl: goal })
      toast.success('Meta de hidratação atualizada!')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      toast.error('Erro ao salvar meta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meta de Hidratação Diária</DialogTitle>
          <DialogDescription>
            Defina sua meta de consumo de água por dia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dailyGoalMl">Meta Diária (ml)</Label>
            <Input
              id="dailyGoalMl"
              type="number"
              step="100"
              value={dailyGoalMl}
              onChange={e => setDailyGoalMl(e.target.value)}
              placeholder="Ex: 2000"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recomendado: 2000-3000ml por dia (8-12 copos)
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Referência:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• 1 copo (250ml) = {(parseFloat(dailyGoalMl) / 250).toFixed(1)} copos/dia</li>
              <li>• 1 garrafa (500ml) = {(parseFloat(dailyGoalMl) / 500).toFixed(1)} garrafas/dia</li>
              <li>• 1 litro = {(parseFloat(dailyGoalMl) / 1000).toFixed(1)} litros/dia</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
