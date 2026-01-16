'use client'

import { useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SLEEP_QUALITY_LABELS, type SleepQuality } from '@/types/health'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'

interface SleepLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SleepLogModal({ open, onOpenChange }: SleepLogModalProps) {
  const { createSleepLog } = useHealth()
  const [loading, setLoading] = useState(false)
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState<SleepQuality>('normal')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bedtime || !wakeTime) {
      toast.error('Preencha horário de dormir e acordar')
      return
    }

    try {
      setLoading(true)
      
      // Construir timestamps completos
      const yesterday = subDays(new Date(), 1)
      const today = new Date()
      
      const bedtimeDate = new Date(`${format(yesterday, 'yyyy-MM-dd')}T${bedtime}:00`)
      const wakeTimeDate = new Date(`${format(today, 'yyyy-MM-dd')}T${wakeTime}:00`)
      
      await createSleepLog({
        sleepDate: format(yesterday, 'yyyy-MM-dd'),
        bedtime: bedtimeDate.toISOString(),
        wakeTime: wakeTimeDate.toISOString(),
        quality,
        notes: notes || undefined
      })
      
      toast.success('Sono registrado com sucesso!')
      setBedtime('')
      setWakeTime('')
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar sono:', error)
      toast.error('Erro ao registrar sono')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Sono</DialogTitle>
          <DialogDescription>
            Adicione informações sobre sua noite de sono
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bedtime">Horário de Dormir</Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Ontem à noite</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wake-time">Horário de Acordar</Label>
            <Input
              id="wake-time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Hoje de manhã</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Qualidade do Sono</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as SleepQuality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SLEEP_QUALITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Acordei no meio da noite, dormi bem..."
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
