'use client'

import { useState, useEffect } from 'react'
import { X, Target, DollarSign, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Goal } from '@/hooks/use-goals'

interface GoalModalProps {
  goal?: Goal | null
  onSave: (goal: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void
  onClose: () => void
}

export function GoalModal({ goal, onSave, onClose }: GoalModalProps) {
  const [name, setName] = useState(goal?.name || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || '')
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() || '0')
  const [targetDate, setTargetDate] = useState(goal?.targetDate || '')
  const [status, setStatus] = useState<'active' | 'completed' | 'cancelled'>(goal?.status || 'active')

  const isEditing = !!goal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedTargetAmount = parseFloat(targetAmount)
    const parsedCurrentAmount = parseFloat(currentAmount)

    if (!name.trim()) {
      alert('Digite o nome da meta')
      return
    }

    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      alert('Digite um valor válido para a meta')
      return
    }

    if (isNaN(parsedCurrentAmount) || parsedCurrentAmount < 0) {
      alert('Digite um valor válido para o progresso atual')
      return
    }

    if (!targetDate) {
      alert('Selecione a data limite')
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      targetAmount: parsedTargetAmount,
      currentAmount: parsedCurrentAmount,
      targetDate,
      status
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {isEditing ? 'Editar Meta' : 'Nova Meta'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Meta</Label>
              <div className="relative">
                <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Ex: Viagem para Europa"
                  required
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-10"
                  placeholder="Detalhes sobre a meta"
                />
              </div>
            </div>

            {/* Valor Alvo */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Valor Alvo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            {/* Valor Atual */}
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Valor Já Economizado</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Data Alvo */}
            <div className="space-y-2">
              <Label htmlFor="targetDate">Data Limite</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Status */}
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Salvar' : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
