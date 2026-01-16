'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHealth } from '@/contexts/health-context'
import { toast } from 'sonner'

interface NutritionGoalsModalProps {
  open: boolean
  onClose: () => void
}

export function NutritionGoalsModal({ open, onClose }: NutritionGoalsModalProps) {
  const { nutritionGoal, createOrUpdateNutritionGoal } = useHealth()
  
  const [dailyCalories, setDailyCalories] = useState('')
  const [dailyProtein, setDailyProtein] = useState('')
  const [dailyCarbohydrates, setDailyCarbohydrates] = useState('')
  const [dailyFats, setDailyFats] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (nutritionGoal && open) {
      setDailyCalories(nutritionGoal.dailyCalories?.toString() || '')
      setDailyProtein(nutritionGoal.dailyProtein?.toString() || '')
      setDailyCarbohydrates(nutritionGoal.dailyCarbohydrates?.toString() || '')
      setDailyFats(nutritionGoal.dailyFats?.toString() || '')
    }
  }, [nutritionGoal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    
    try {
      await createOrUpdateNutritionGoal({
        dailyCalories: dailyCalories ? parseFloat(dailyCalories) : undefined,
        dailyProtein: dailyProtein ? parseFloat(dailyProtein) : undefined,
        dailyCarbohydrates: dailyCarbohydrates ? parseFloat(dailyCarbohydrates) : undefined,
        dailyFats: dailyFats ? parseFloat(dailyFats) : undefined
      })

      toast.success('Metas nutricionais atualizadas!')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar metas:', error)
      toast.error('Erro ao salvar metas')
    } finally {
      setLoading(false)
    }
  }

  // Calcular macros sugeridos baseados nas calorias (40% carbs, 30% protein, 30% fats)
  const suggestedProtein = dailyCalories ? Math.round((parseFloat(dailyCalories) * 0.30) / 4) : 0
  const suggestedCarbs = dailyCalories ? Math.round((parseFloat(dailyCalories) * 0.40) / 4) : 0
  const suggestedFats = dailyCalories ? Math.round((parseFloat(dailyCalories) * 0.30) / 9) : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Metas Nutricionais</DialogTitle>
          <DialogDescription>
            Configure suas metas diárias de calorias e macronutrientes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyCalories">Calorias Diárias (kcal)</Label>
            <Input
              id="dailyCalories"
              type="number"
              step="1"
              min="0"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(e.target.value)}
              placeholder="2000"
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 1800-2500 kcal para manutenção
            </p>
          </div>

          {dailyCalories && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">Sugestão de macros:</p>
              <p className="text-muted-foreground">
                • Proteínas: {suggestedProtein}g (30% das calorias)
              </p>
              <p className="text-muted-foreground">
                • Carboidratos: {suggestedCarbs}g (40% das calorias)
              </p>
              <p className="text-muted-foreground">
                • Gorduras: {suggestedFats}g (30% das calorias)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dailyProtein">Proteínas Diárias (g)</Label>
            <Input
              id="dailyProtein"
              type="number"
              step="0.1"
              min="0"
              value={dailyProtein}
              onChange={(e) => setDailyProtein(e.target.value)}
              placeholder={suggestedProtein.toString()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyCarbohydrates">Carboidratos Diários (g)</Label>
            <Input
              id="dailyCarbohydrates"
              type="number"
              step="0.1"
              min="0"
              value={dailyCarbohydrates}
              onChange={(e) => setDailyCarbohydrates(e.target.value)}
              placeholder={suggestedCarbs.toString()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyFats">Gorduras Diárias (g)</Label>
            <Input
              id="dailyFats"
              type="number"
              step="0.1"
              min="0"
              value={dailyFats}
              onChange={(e) => setDailyFats(e.target.value)}
              placeholder={suggestedFats.toString()}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Metas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
