'use client'

import { useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GoalType } from '@/types/health'
import { toast } from 'sonner'

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  weight: 'Peso',
  activity: 'Atividade',
  sleep: 'Sono'
}

const GOAL_TYPE_UNITS: Record<GoalType, string> = {
  weight: 'kg',
  activity: 'minutos por semana',
  sleep: 'horas por noite'
}

export function GoalModal({ open, onOpenChange }: GoalModalProps) {
  const { createGoal } = useHealth()
  const [loading, setLoading] = useState(false)
  const [goalType, setGoalType] = useState<GoalType>('weight')
  const [targetValue, setTargetValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const valueNum = parseFloat(targetValue)
    if (isNaN(valueNum) || valueNum <= 0) {
      toast.error('Digite um valor válido')
      return
    }

    try {
      setLoading(true)
      await createGoal({
        goalType,
        targetValue: valueNum
      })
      
      toast.success('Meta criada com sucesso!')
      setTargetValue('')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      toast.error('Erro ao criar meta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Meta</DialogTitle>
          <DialogDescription>
            Defina uma meta de saúde para acompanhar
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-type">Tipo de Meta</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-value">
              Valor Alvo
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="target-value"
                type="number"
                step={goalType === 'weight' ? '0.1' : '1'}
                placeholder={goalType === 'weight' ? '70' : goalType === 'activity' ? '150' : '8'}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {GOAL_TYPE_UNITS[goalType]}
              </span>
            </div>
            {goalType === 'activity' && (
              <p className="text-xs text-muted-foreground">
                OMS recomenda 150 minutos de atividade moderada por semana
              </p>
            )}
            {goalType === 'sleep' && (
              <p className="text-xs text-muted-foreground">
                Recomendado: 7-9 horas por noite
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
