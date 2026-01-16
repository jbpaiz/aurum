'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHealth } from '@/contexts/health-context'
import { HydrationLog } from '@/types/health'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface HydrationLogModalProps {
  open: boolean
  onClose: () => void
  editing: HydrationLog | null
}

export function HydrationLogModal({ open, onClose, editing }: HydrationLogModalProps) {
  const { createHydrationLog, updateHydrationLog } = useHealth()
  
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'))
  const [amountMl, setAmountMl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setLogDate(editing.logDate)
      const loggedTime = new Date(editing.loggedAt)
      setLogTime(format(loggedTime, 'HH:mm'))
      setAmountMl(editing.amountMl.toString())
      setNotes(editing.notes || '')
    } else {
      resetForm()
    }
  }, [editing, open])

  const resetForm = () => {
    setLogDate(format(new Date(), 'yyyy-MM-dd'))
    setLogTime(format(new Date(), 'HH:mm'))
    setAmountMl('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amountMl || parseFloat(amountMl) <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }

    setLoading(true)

    try {
      const [hours, minutes] = logTime.split(':')
      const loggedAt = new Date(logDate)
      loggedAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const input = {
        logDate,
        amountMl: parseFloat(amountMl),
        loggedAt: loggedAt.toISOString(),
        notes: notes || undefined
      }

      if (editing) {
        await updateHydrationLog(editing.id, input)
        toast.success('Registro atualizado com sucesso!')
      } else {
        await createHydrationLog(input)
        toast.success('Água registrada com sucesso!')
      }

      resetForm()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar registro:', error)
      toast.error('Erro ao salvar registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar Registro de Água' : 'Registrar Água'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logDate">Data</Label>
              <Input
                id="logDate"
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="logTime">Hora</Label>
              <Input
                id="logTime"
                type="time"
                value={logTime}
                onChange={e => setLogTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amountMl">Quantidade (ml)</Label>
            <Input
              id="amountMl"
              type="number"
              step="1"
              value={amountMl}
              onChange={e => setAmountMl(e.target.value)}
              placeholder="Ex: 250"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editing ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
