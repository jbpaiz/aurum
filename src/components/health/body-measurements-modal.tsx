'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHealth } from '@/contexts/health-context'
import { BodyMeasurement, MEASUREMENT_LABELS } from '@/types/health'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface BodyMeasurementsModalProps {
  open: boolean
  onClose: () => void
  editing: BodyMeasurement | null
}

export function BodyMeasurementsModal({ open, onClose, editing }: BodyMeasurementsModalProps) {
  const { createBodyMeasurement, updateBodyMeasurement } = useHealth()
  
  const [measurementDate, setMeasurementDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [chest, setChest] = useState('')
  const [armLeft, setArmLeft] = useState('')
  const [armRight, setArmRight] = useState('')
  const [thighLeft, setThighLeft] = useState('')
  const [thighRight, setThighRight] = useState('')
  const [calfLeft, setCalfLeft] = useState('')
  const [calfRight, setCalfRight] = useState('')
  const [neck, setNeck] = useState('')
  const [bodyFatPercentage, setBodyFatPercentage] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setMeasurementDate(editing.measurementDate)
      setWaist(editing.waist?.toString() || '')
      setHips(editing.hips?.toString() || '')
      setChest(editing.chest?.toString() || '')
      setArmLeft(editing.armLeft?.toString() || '')
      setArmRight(editing.armRight?.toString() || '')
      setThighLeft(editing.thighLeft?.toString() || '')
      setThighRight(editing.thighRight?.toString() || '')
      setCalfLeft(editing.calfLeft?.toString() || '')
      setCalfRight(editing.calfRight?.toString() || '')
      setNeck(editing.neck?.toString() || '')
      setBodyFatPercentage(editing.bodyFatPercentage?.toString() || '')
      setMuscleMass(editing.muscleMass?.toString() || '')
      setNotes(editing.notes || '')
    } else {
      resetForm()
    }
  }, [editing, open])

  const resetForm = () => {
    setMeasurementDate(format(new Date(), 'yyyy-MM-dd'))
    setWaist('')
    setHips('')
    setChest('')
    setArmLeft('')
    setArmRight('')
    setThighLeft('')
    setThighRight('')
    setCalfLeft('')
    setCalfRight('')
    setNeck('')
    setBodyFatPercentage('')
    setMuscleMass('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const input = {
        measurementDate,
        waist: waist ? parseFloat(waist) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
        chest: chest ? parseFloat(chest) : undefined,
        armLeft: armLeft ? parseFloat(armLeft) : undefined,
        armRight: armRight ? parseFloat(armRight) : undefined,
        thighLeft: thighLeft ? parseFloat(thighLeft) : undefined,
        thighRight: thighRight ? parseFloat(thighRight) : undefined,
        calfLeft: calfLeft ? parseFloat(calfLeft) : undefined,
        calfRight: calfRight ? parseFloat(calfRight) : undefined,
        neck: neck ? parseFloat(neck) : undefined,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
        muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
        notes: notes || undefined
      }

      if (editing) {
        await updateBodyMeasurement(editing.id, input)
        toast.success('Medidas atualizadas com sucesso!')
      } else {
        await createBodyMeasurement(input)
        toast.success('Medidas registradas com sucesso!')
      }

      resetForm()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar medidas:', error)
      toast.error('Erro ao salvar medidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar Medidas Corporais' : 'Registrar Medidas Corporais'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="measurementDate">Data da Medição</Label>
            <Input
              id="measurementDate"
              type="date"
              value={measurementDate}
              onChange={e => setMeasurementDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waist">{MEASUREMENT_LABELS.waist} (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                value={waist}
                onChange={e => setWaist(e.target.value)}
                placeholder="Ex: 80.5"
              />
            </div>

            <div>
              <Label htmlFor="hips">{MEASUREMENT_LABELS.hips} (cm)</Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                value={hips}
                onChange={e => setHips(e.target.value)}
                placeholder="Ex: 95.0"
              />
            </div>

            <div>
              <Label htmlFor="chest">{MEASUREMENT_LABELS.chest} (cm)</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                value={chest}
                onChange={e => setChest(e.target.value)}
                placeholder="Ex: 100.0"
              />
            </div>

            <div>
              <Label htmlFor="neck">{MEASUREMENT_LABELS.neck} (cm)</Label>
              <Input
                id="neck"
                type="number"
                step="0.1"
                value={neck}
                onChange={e => setNeck(e.target.value)}
                placeholder="Ex: 38.0"
              />
            </div>

            <div>
              <Label htmlFor="armLeft">{MEASUREMENT_LABELS.armLeft} (cm)</Label>
              <Input
                id="armLeft"
                type="number"
                step="0.1"
                value={armLeft}
                onChange={e => setArmLeft(e.target.value)}
                placeholder="Ex: 32.0"
              />
            </div>

            <div>
              <Label htmlFor="armRight">{MEASUREMENT_LABELS.armRight} (cm)</Label>
              <Input
                id="armRight"
                type="number"
                step="0.1"
                value={armRight}
                onChange={e => setArmRight(e.target.value)}
                placeholder="Ex: 32.5"
              />
            </div>

            <div>
              <Label htmlFor="thighLeft">{MEASUREMENT_LABELS.thighLeft} (cm)</Label>
              <Input
                id="thighLeft"
                type="number"
                step="0.1"
                value={thighLeft}
                onChange={e => setThighLeft(e.target.value)}
                placeholder="Ex: 55.0"
              />
            </div>

            <div>
              <Label htmlFor="thighRight">{MEASUREMENT_LABELS.thighRight} (cm)</Label>
              <Input
                id="thighRight"
                type="number"
                step="0.1"
                value={thighRight}
                onChange={e => setThighRight(e.target.value)}
                placeholder="Ex: 55.5"
              />
            </div>

            <div>
              <Label htmlFor="calfLeft">{MEASUREMENT_LABELS.calfLeft} (cm)</Label>
              <Input
                id="calfLeft"
                type="number"
                step="0.1"
                value={calfLeft}
                onChange={e => setCalfLeft(e.target.value)}
                placeholder="Ex: 36.0"
              />
            </div>

            <div>
              <Label htmlFor="calfRight">{MEASUREMENT_LABELS.calfRight} (cm)</Label>
              <Input
                id="calfRight"
                type="number"
                step="0.1"
                value={calfRight}
                onChange={e => setCalfRight(e.target.value)}
                placeholder="Ex: 36.5"
              />
            </div>

            <div>
              <Label htmlFor="bodyFatPercentage">{MEASUREMENT_LABELS.bodyFatPercentage} (%)</Label>
              <Input
                id="bodyFatPercentage"
                type="number"
                step="0.1"
                value={bodyFatPercentage}
                onChange={e => setBodyFatPercentage(e.target.value)}
                placeholder="Ex: 15.5"
              />
            </div>

            <div>
              <Label htmlFor="muscleMass">{MEASUREMENT_LABELS.muscleMass} (kg)</Label>
              <Input
                id="muscleMass"
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={e => setMuscleMass(e.target.value)}
                placeholder="Ex: 45.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações sobre as medições..."
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
