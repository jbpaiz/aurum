'use client'

import { useState } from 'react'
import { useHealth } from '@/contexts/health-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface WeightLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeightLogModal({ open, onOpenChange }: WeightLogModalProps) {
  const { createWeightLog } = useHealth()
  const [loading, setLoading] = useState(false)
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error('Digite um peso válido')
      return
    }

    try {
      setLoading(true)
      await createWeightLog({
        weight: weightNum,
        recordedAt: new Date().toISOString(),
        note: note || undefined
      })
      
      toast.success('Peso registrado com sucesso!')
      setWeight('')
      setNote('')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar peso:', error)
      toast.error('Erro ao registrar peso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Peso</DialogTitle>
          <DialogDescription>
            Adicione sua medição de peso atual
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea
              id="note"
              placeholder="Ex: Após treino, em jejum..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
