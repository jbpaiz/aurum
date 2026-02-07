'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, Save, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTasks } from '@/contexts/tasks-context'
import type { TaskCustomFieldOption } from '@/types/tasks'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CustomFieldConfigModalProps {
  open: boolean
  onClose: () => void
}

const AVAILABLE_COLORS = [
  '#94A3B8', // Cinza
  '#64748B', // Cinza escuro
  '#3B82F6', // Azul
  '#0EA5E9', // Azul claro
  '#6366F1', // Índigo
  '#8B5CF6', // Roxo
  '#10B981', // Verde
  '#14B8A6', // Teal
  '#F59E0B', // Âmbar
  '#F97316', // Laranja
  '#EF4444', // Vermelho
  '#DC2626', // Vermelho escuro
  '#EC4899', // Rosa
]

const getNextOptionValue = (list: TaskCustomFieldOption[]) => {
  const maxIndex = list.reduce((acc, opt) => {
    const match = opt.optionValue.match(/option_(\d+)/)
    const num = match ? Number(match[1]) : NaN
    return Number.isFinite(num) ? Math.max(acc, num) : acc
  }, 0)
  return `option_${String(maxIndex + 1).padStart(2, '0')}`
}

interface SortableOptionItemProps {
  option: TaskCustomFieldOption
  onEdit: (option: TaskCustomFieldOption) => void
  onDelete: (optionId: string) => void
}

function SortableOptionItem({ option, onEdit, onDelete }: SortableOptionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div
        className="h-4 w-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: option.color }}
      />
      <span className="flex-1 text-sm text-gray-900 dark:text-white">{option.optionLabel}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onEdit(option)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(option.id)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function CustomFieldConfigModal({ open, onClose }: CustomFieldConfigModalProps) {
  const { priorityField, updateCustomField, createFieldOption, updateFieldOption, deleteFieldOption, refresh } = useTasks()
  
  const [fieldName, setFieldName] = useState('')
  const [options, setOptions] = useState<TaskCustomFieldOption[]>([])
  const [editingOption, setEditingOption] = useState<TaskCustomFieldOption | null>(null)
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionColor, setNewOptionColor] = useState(AVAILABLE_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (open && priorityField) {
      setFieldName(priorityField.fieldName)
      setOptions([...priorityField.options].sort((a, b) => a.position - b.position))
    }
  }, [open, priorityField])

  const handleSaveFieldName = async () => {
    if (!priorityField || !fieldName.trim()) return

    const trimmedName = fieldName.trim().slice(0, 20)
    setIsSaving(true)
    try {
      await updateCustomField({
        id: priorityField.id,
        fieldName: trimmedName,
      })
      await refresh()
    } catch (error) {
      console.error('Erro ao atualizar nome do campo:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddOption = async () => {
    if (!priorityField || !newOptionLabel.trim()) return

    const trimmedLabel = newOptionLabel.trim().slice(0, 20)
    const optionValue = getNextOptionValue(options)

    setIsSaving(true)
    try {
      await createFieldOption({
        customFieldId: priorityField.id,
        optionValue,
        optionLabel: trimmedLabel,
        color: newOptionColor,
        position: options.length + 1,
      })
      await refresh()
      setNewOptionLabel('')
      setNewOptionColor(AVAILABLE_COLORS[0])
    } catch (error) {
      console.error('Erro ao adicionar opção:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditOption = async () => {
    if (!editingOption || !newOptionLabel.trim()) return

    const trimmedLabel = newOptionLabel.trim().slice(0, 20)

    setIsSaving(true)
    try {
      await updateFieldOption({
        id: editingOption.id,
        optionLabel: trimmedLabel,
        color: newOptionColor,
      })
      await refresh()
      setEditingOption(null)
      setNewOptionLabel('')
      setNewOptionColor(AVAILABLE_COLORS[0])
    } catch (error) {
      console.error('Erro ao editar opção:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Deseja realmente remover esta opção?')) return

    // Atualiza a lista local para refletir imediatamente a remoção e manter a ordem exibida
    const nextOptions = options.filter((opt) => opt.id !== optionId)
    setOptions(nextOptions)

    setIsSaving(true)
    try {
      await deleteFieldOption(optionId)
      // Regravar a ordem atual exibida após a remoção
      await Promise.all(
        nextOptions.map((opt, index) =>
          updateFieldOption({
            id: opt.id,
            position: index + 1,
          })
        )
      )
      await refresh()
    } catch (error) {
      console.error('Erro ao deletar opção:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = options.findIndex((opt) => opt.id === active.id)
    const newIndex = options.findIndex((opt) => opt.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(options, oldIndex, newIndex)
    setOptions(reordered)

    // Atualizar posições no banco
    setIsSaving(true)
    try {
      await Promise.all(
        reordered.map((opt, index) =>
          updateFieldOption({
            id: opt.id,
            position: index + 1,
          })
        )
      )
      await refresh()
    } catch (error) {
      console.error('Erro ao reordenar opções:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (option: TaskCustomFieldOption) => {
    setEditingOption(option)
    setNewOptionLabel(option.optionLabel)
    setNewOptionColor(option.color)
  }

  const cancelEdit = () => {
    setEditingOption(null)
    setNewOptionLabel('')
    setNewOptionColor(AVAILABLE_COLORS[0])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Configurar Campo Customizável
        </h2>

        {/* Nome do Campo */}
        <div className="mb-6">
          <Label htmlFor="field-name">Nome do Campo (máx. 20 caracteres)</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="field-name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value.slice(0, 20))}
              placeholder="Ex: Prioridade, Sprint, Urgência..."
              maxLength={20}
            />
            <Button onClick={handleSaveFieldName} disabled={isSaving || !fieldName.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {fieldName.length}/20 caracteres
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Opções do Campo
          </h3>

          {/* Lista de Opções */}
          {options.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={options.map((opt) => opt.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 mb-4">
                  {options.map((option) => (
                    <SortableOptionItem
                      key={option.id}
                      option={option}
                      onEdit={startEdit}
                      onDelete={handleDeleteOption}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Formulário de Adicionar/Editar */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {editingOption ? 'Editar Opção' : 'Nova Opção'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="option-label" className="text-xs">
                  Descrição (máx. 20 caracteres)
                </Label>
                <Input
                  id="option-label"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value.slice(0, 20))}
                  placeholder="Ex: Sprint 01, Sprint 02"
                  maxLength={20}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {newOptionLabel.length}/20 caracteres
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                  O valor interno é gerado automaticamente (opção_01, opção_02...).
                </p>
              </div>

              <div>
                <Label className="text-xs">Cor do Marcador</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewOptionColor(color)}
                      className={`h-8 w-8 rounded-md transition-all ${
                        newOptionColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingOption ? (
                  <>
                    <Button
                      onClick={handleEditOption}
                      disabled={isSaving || !newOptionLabel.trim()}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salvar Alterações
                    </Button>
                    <Button onClick={cancelEdit} variant="outline">
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddOption}
                    disabled={isSaving || !newOptionLabel.trim()}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Opção
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
