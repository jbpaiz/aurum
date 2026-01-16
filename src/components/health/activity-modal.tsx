'use client'

import { useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVITY_LABELS, ACTIVITY_ICONS, INTENSITY_LABELS, type ActivityType, type ActivityIntensity } from '@/types/health'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityModal({ open, onOpenChange }: ActivityModalProps) {
  const { createActivity } = useHealth()
  const [loading, setLoading] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('walking')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<ActivityIntensity>('medium')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('Digite uma duração válida')
      return
    }

    try {
      setLoading(true)
      await createActivity({
        activityType,
        durationMinutes: durationNum,
        intensity,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        activityDate: format(new Date(), 'yyyy-MM-dd'),
        notes: notes || undefined
      })
      
      toast.success('Atividade registrada com sucesso!')
      setDuration('')
      setCalories('')
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar atividade:', error)
      toast.error('Erro ao registrar atividade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Atividade</DialogTitle>
          <DialogDescription>
            Adicione uma atividade física realizada
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-type">Tipo de Atividade</Label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span>{ACTIVITY_ICONS[value as ActivityType]}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">Intensidade</Label>
            <Select value={intensity} onValueChange={(v) => setIntensity(v as ActivityIntensity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTENSITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">Calorias Queimadas (opcional)</Label>
            <Input
              id="calories"
              type="number"
              placeholder="200"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Como você se sentiu durante a atividade..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
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
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
