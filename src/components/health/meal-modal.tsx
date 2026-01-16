'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealth } from '@/contexts/health-context'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Meal, MealType } from '@/types/health'

interface MealModalProps {
  open: boolean
  onClose: () => void
  editing: Meal | null
}

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Café da Manhã', emoji: '🌅' },
  { value: 'lunch', label: 'Almoço', emoji: '🍽️' },
  { value: 'dinner', label: 'Jantar', emoji: '🌙' },
  { value: 'snack', label: 'Lanche', emoji: '🍎' }
]

export function MealModal({ open, onClose, editing }: MealModalProps) {
  const { createMeal, updateMeal } = useHealth()
  
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealTime, setMealTime] = useState(format(new Date(), 'HH:mm'))
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbohydrates, setCarbohydrates] = useState('')
  const [fats, setFats] = useState('')
  const [fiber, setFiber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setMealDate(editing.mealDate)
      setMealTime(editing.mealTime)
      setMealType(editing.mealType)
      setDescription(editing.description)
      setCalories(editing.calories?.toString() || '')
      setProtein(editing.protein?.toString() || '')
      setCarbohydrates(editing.carbohydrates?.toString() || '')
      setFats(editing.fats?.toString() || '')
      setFiber(editing.fiber?.toString() || '')
      setNotes(editing.notes || '')
    } else {
      resetForm()
    }
  }, [editing, open])

  const resetForm = () => {
    setMealDate(format(new Date(), 'yyyy-MM-dd'))
    setMealTime(format(new Date(), 'HH:mm'))
    setMealType('lunch')
    setDescription('')
    setCalories('')
    setProtein('')
    setCarbohydrates('')
    setFats('')
    setFiber('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }

    setLoading(true)
    
    try {
      const mealData = {
        mealDate,
        mealTime,
        mealType,
        description: description.trim(),
        calories: calories ? parseFloat(calories) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbohydrates: carbohydrates ? parseFloat(carbohydrates) : undefined,
        fats: fats ? parseFloat(fats) : undefined,
        fiber: fiber ? parseFloat(fiber) : undefined,
        notes: notes.trim() || undefined
      }

      if (editing) {
        await updateMeal(editing.id, mealData)
        toast.success('Refeição atualizada!')
      } else {
        await createMeal(mealData)
        toast.success('Refeição registrada!')
      }

      resetForm()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar refeição:', error)
      toast.error('Erro ao salvar refeição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Refeição' : 'Registrar Refeição'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Atualize as informações da refeição' : 'Registre o que você comeu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mealDate">Data</Label>
              <Input
                id="mealDate"
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealTime">Horário</Label>
              <Input
                id="mealTime"
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mealType">Tipo de Refeição</Label>
            <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Arroz, feijão, frango grelhado..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Proteínas (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbohydrates">Carboidratos (g)</Label>
              <Input
                id="carbohydrates"
                type="number"
                step="0.1"
                min="0"
                value={carbohydrates}
                onChange={(e) => setCarbohydrates(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fats">Gorduras (g)</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                min="0"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiber">Fibras (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                min="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editing ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
