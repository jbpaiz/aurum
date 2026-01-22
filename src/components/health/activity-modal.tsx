'use client'

import { useState, useEffect } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACTIVITY_LABELS, ACTIVITY_ICONS, INTENSITY_LABELS, type ActivityType, type ActivityIntensity, type Activity } from '@/types/health'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingActivity?: Activity | null
}

export function ActivityModal({ open, onOpenChange, editingActivity }: ActivityModalProps) {
  const { createActivity, updateActivity } = useHealth()
  const [loading, setLoading] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('walking')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<ActivityIntensity>('medium')
  const [calories, setCalories] = useState('')
  const [distance, setDistance] = useState('')
  const [activityDate, setActivityDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingActivity) {
      setActivityType(editingActivity.activityType)
      setDuration(editingActivity.durationMinutes.toString())
      setDistance(editingActivity.distanceKm?.toString() || '')
      setIntensity(editingActivity.intensity || 'medium')
      setCalories(editingActivity.caloriesBurned?.toString() || '')
      setActivityDate(editingActivity.activityDate)
      setNotes(editingActivity.notes || '')
    } else {
      setActivityType('walking')
      setDuration('')
      setDistance('')
      setIntensity('medium')
      setCalories('')
      setActivityDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
    }
  }, [editingActivity, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('Digite uma duração válida')
      return
    }

    const distanceNum = distance ? parseFloat(distance) : null
    if (distance && (isNaN(distanceNum as number) || (distanceNum as number) < 0)) {
      toast.error('Digite uma distância válida (km)')
      return
    }

    try {
      setLoading(true)
      
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          activityType,
          durationMinutes: durationNum,
          distanceKm: distanceNum ?? undefined,
          intensity,
          caloriesBurned: calories ? parseInt(calories) : undefined,
          activityDate,
          notes: notes || undefined
        })
        toast.success('Atividade atualizada com sucesso!')
      } else {
        await createActivity({
          activityType,
          durationMinutes: durationNum,
          distanceKm: distanceNum ?? undefined,
          intensity,
          caloriesBurned: calories ? parseInt(calories) : undefined,
          activityDate,
          notes: notes || undefined
        })
        toast.success('Atividade registrada com sucesso!')
      }
      
      setDuration('')
      setCalories('')
      setActivityDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar atividade:', error)
      toast.error('Erro ao salvar atividade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Registrar Atividade'}</DialogTitle>
          <DialogDescription>
            {editingActivity ? 'Atualize os dados da atividade' : 'Adicione uma atividade física realizada'}
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
            <Label htmlFor="activity-date">Data</Label>
            <Input
              id="activity-date"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
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
            <Label htmlFor="distance">Distância (km) (opcional)</Label>
            <Input
              id="distance"
              type="number"
              step="0.01"
              placeholder="2.5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
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
