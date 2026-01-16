'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { X, Plus, Trash2, Check, GripVertical, MoveRight, Copy } from 'lucide-react'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import type {
  CreateTaskInput,
  TaskCard,
  TaskChecklistItem,
  TaskColumn,
  TaskPriority,
  TaskType
} from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTasks } from '@/contexts/tasks-context'
import { MoveTaskModal } from '@/components/tasks/move-task-modal'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  columns: TaskColumn[]
  defaultColumnId?: string
  task?: TaskCard | null
  onSave: (payload: CreateTaskInput & { id?: string }) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
  onCloneTask?: (task: TaskCard) => void
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Tarefa' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'História' },
  { value: 'epic', label: 'Épico' }
]

// Chaves para persistir dados do formulário
const STORAGE_KEY = 'task_modal_form_data'

export function TaskModal({ open, onClose, columns, defaultColumnId, task, onSave, onDeleteTask, onCloneTask }: TaskModalProps) {
  const { activeBoard, activeProject, priorityField } = useTasks()
  const isInitialized = useRef(false)
  
  // Buscar as colunas corretas: se a tarefa está em outro quadro, pegar as colunas daquele quadro
  const availableColumns = useMemo(() => {
    if (!task) return columns
    
    // Se a tarefa está no quadro ativo, usar as colunas passadas por props
    if (task.boardId === activeBoard?.id) return columns
    
    // Se a tarefa está em outro quadro, buscar as colunas daquele quadro
    const taskBoard = activeProject?.boards.find(b => b.id === task.boardId)
    if (taskBoard) return taskBoard.columns
    
    // Fallback para as colunas do quadro ativo
    return columns
  }, [task, activeBoard, activeProject, columns])
  
  // Função para carregar dados persistidos
  const loadPersistedData = () => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  // Inicializar com valores vazios/padrão
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskKey, setTaskKey] = useState('')
  const [columnId, setColumnId] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [type, setType] = useState<TaskType>('task')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [labelsInput, setLabelsInput] = useState('')
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([])
  const [checklistItem, setChecklistItem] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isEditing = Boolean(task)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const resolvedColumnId = columnId || task?.columnId || defaultColumnId || availableColumns[0]?.id || ''
  const selectedColumn = availableColumns.find((column) => column.id === resolvedColumnId)

  // Garantir que columnId seja setado corretamente quando a tarefa muda
  useEffect(() => {
    if (open && task && !columnId) {
      // Setar o columnId da tarefa imediatamente
      setColumnId(task.columnId)
    }
  }, [open, task, columnId])

  // Salvar dados no sessionStorage sempre que mudarem (mas só depois de inicializar)
  useEffect(() => {
    if (typeof window === 'undefined' || !open || !isInitialized.current) return
    
    const formData = {
      title,
      subtitle,
      description,
      taskKey,
      columnId,
      priority,
      type,
      startDate,
      endDate,
      labelsInput,
      checklist,
      // Salvar também o ID da tarefa sendo editada
      taskId: task?.id
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [title, subtitle, description, taskKey, columnId, priority, type, startDate, endDate, labelsInput, checklist, open, task])

  // Limpar dados persistidos
  const clearPersistedData = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    if (!open) {
      isInitialized.current = false
      return
    }
    
    // Se já foi inicializado nesta sessão, não recarregar
    if (isInitialized.current) return
    
    // Carregar dados persistidos primeiro (se existirem)
    const persisted = loadPersistedData()
    
    // Se estiver editando uma tarefa existente
    if (task) {
      // Se há dados persistidos da mesma tarefa, usar eles (usuário estava editando)
      if (persisted && persisted.taskId === task.id) {
        setTitle(persisted.title ?? task.title ?? '')
        setSubtitle(persisted.subtitle ?? task.subtitle ?? '')
        setDescription(persisted.description ?? task.description ?? '')
        setTaskKey(persisted.taskKey ?? task.key ?? '')
        // SEMPRE usar task.columnId atual, nunca o persistido (tarefa pode ter sido movida)
        setColumnId(task.columnId ?? defaultColumnId ?? availableColumns[0]?.id ?? '')
        setPriority(persisted.priority ?? task.priority ?? 'medium')
        setType(persisted.type ?? task.type ?? 'task')
        setStartDate(persisted.startDate ?? task.startDate ?? '')
        setEndDate(persisted.endDate ?? task.endDate ?? '')
        setLabelsInput(persisted.labelsInput ?? task.labels?.join(', ') ?? '')
        setChecklist(persisted.checklist ?? task.checklist ?? [])
      } else {
        // Se não há dados persistidos ou são de outra tarefa, carregar dados originais
        clearPersistedData()
        
        setTitle(task.title ?? '')
        setSubtitle(task.subtitle ?? '')
        setDescription(task.description ?? '')
        setTaskKey(task.key ?? '')
        setColumnId(task.columnId ?? defaultColumnId ?? availableColumns[0]?.id ?? '')
        setPriority(task.priority ?? 'medium')
        setType(task.type ?? 'task')
        setStartDate(task.startDate ?? '')
        setEndDate(task.endDate ?? '')
        setLabelsInput(task.labels?.join(', ') ?? '')
        setChecklist(task.checklist ?? [])
      }
      
      setChecklistItem('')
      setFormError(null)
    } else {
      // Se for nova tarefa, tentar carregar dados persistidos
      if (persisted && !persisted.taskId) {
        setTitle(persisted.title ?? '')
        setSubtitle(persisted.subtitle ?? '')
        setDescription(persisted.description ?? '')
        setTaskKey(persisted.taskKey ?? '')
        setColumnId(persisted.columnId ?? defaultColumnId ?? availableColumns[0]?.id ?? '')
        setPriority(persisted.priority ?? 'medium')
        setType(persisted.type ?? 'task')
        setStartDate(persisted.startDate ?? '')
        setEndDate(persisted.endDate ?? '')
        setLabelsInput(persisted.labelsInput ?? '')
        setChecklist(persisted.checklist ?? [])
      } else {
        // Se não há dados persistidos, limpar e usar valores padrão
        clearPersistedData()
        setTitle('')
        setSubtitle('')
        setDescription('')
        setTaskKey('')
        setColumnId(defaultColumnId ?? availableColumns[0]?.id ?? '')
        setPriority('medium')
        setType('task')
        setStartDate('')
        setEndDate('')
        setLabelsInput('')
        setChecklist([])
      }
    }
    
    // Marcar como inicializado após carregar os dados
    isInitialized.current = true
  }, [open, task, defaultColumnId, availableColumns])

  const labels = useMemo(
    () =>
      labelsInput
        .split(',')
        .map((label: string) => label.trim())
        .filter(Boolean),
    [labelsInput]
  )

  const randomId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 12)
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  const updateChecklistItemTitle = (id: string, title: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)))
  }

  const handleAddChecklistItem = () => {
    if (!checklistItem.trim()) return
    setChecklist((prev) => [
      ...prev,
      {
        id: randomId(),
        title: checklistItem.trim(),
        done: false
      }
    ])
    setChecklistItem('')
  }

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id))
  }

  const handleChecklistReorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setChecklist((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setFormError('Informe um título para a tarefa.')
      return
    }
    if (!resolvedColumnId) {
      setFormError('Selecione a situação antes de salvar.')
      return
    }
    setFormError(null)

    setIsSaving(true)
    const normalizedKey = taskKey.trim()
    if (isEditing && !normalizedKey) {
      setFormError('Informe um código para a tarefa, ou utilize o padrão sugerido.')
      setIsSaving(false)
      return
    }

    // Validar título duplicado (exceto ao editar a própria tarefa)
    const allTasks = activeBoard?.columns.flatMap(col => col.tasks) ?? []
    
    const duplicateTitle = allTasks.find(
      t => t.title?.toLowerCase().trim() === title.toLowerCase().trim() && t.id !== task?.id
    )
    
    if (duplicateTitle) {
      const duplicateColumn = activeBoard?.columns.find(col => 
        col.tasks.some(t => t.id === duplicateTitle.id)
      )
      
      setFormError(
        `Já existe outra tarefa com o título "${title}" na situação "${duplicateColumn?.name || 'desconhecida'}". ` +
        `${task?.id ? `(Esta tarefa: ${task.id.slice(0, 8)}... | Duplicata: ${duplicateTitle.id.slice(0, 8)}...)` : ''} ` +
        `Delete a tarefa duplicada ou use outro título.`
      )
      setIsSaving(false)
      return
    }

    // Validar código duplicado se fornecido (exceto ao editar a própria tarefa)
    if (normalizedKey) {
      const duplicateKey = allTasks.find(
        t => t.key?.toLowerCase() === normalizedKey.toLowerCase() && t.id !== task?.id
      )
      if (duplicateKey) {
        setFormError(`Já existe uma tarefa com o código "${normalizedKey}". Use outro código.`)
        setIsSaving(false)
        return
      }
    }

    const payload = {
      id: task?.id,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description,
      columnId: resolvedColumnId,
      key: normalizedKey || undefined,
      priority,
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      labels,
      checklist
    }

    console.log('📋 TaskModal payload:', {
      'taskKey state': taskKey,
      'normalizedKey': normalizedKey,
      'payload.key': payload.key,
      'full payload': payload
    })

    await onSave(payload)
    setIsSaving(false)
    
    // Limpar dados persistidos após salvar com sucesso
    clearPersistedData()
    onClose()
  }

  const handleDeleteTask = async () => {
    if (!task?.id || !onDeleteTask) return
    try {
      setIsDeleting(true)
      await onDeleteTask(task.id)
      // Limpar dados persistidos após deletar
      clearPersistedData()
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    // Só limpa dados persistidos se não estiver editando
    // (ao editar, os dados já foram limpos no useEffect)
    if (!task) {
      clearPersistedData()
    }
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Editar tarefa' : 'Nova tarefa'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl dark:shadow-gray-900/50"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Defina título, prioridade, etiquetas e checklist</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Implementar fluxo de onboarding" />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo (opcional)</Label>
              <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Ex: Tela de boas-vindas" />
            </div>
            <div className="space-y-2">
              <Label>Código (ex: JIRA-120)</Label>
              <Input value={taskKey} onChange={(event) => setTaskKey(event.target.value)} placeholder={task?.key ?? 'AUR-123'} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Situação</Label>
            <Select value={resolvedColumnId} onValueChange={setColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                {availableColumns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                      {column.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{priorityField?.fieldName || 'Prioridade'}</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {priorityField && priorityField.options.length > 0
                  ? priorityField.options.map((option) => (
                      <option key={option.optionValue} value={option.optionValue}>
                        {option.optionLabel}
                      </option>
                    ))
                  : Object.keys(TASK_PRIORITY_COLORS).map((value) => (
                      <option key={value} value={value}>
                        {TASK_PRIORITY_LABELS[value as TaskPriority]}
                      </option>
                    ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {TASK_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Início da tarefa</Label>
              <Input type="date" value={startDate || ''} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim da tarefa</Label>
              <Input type="date" value={endDate || ''} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Se deixar os campos em branco, o Aurum preenche automaticamente ao mover a tarefa para &quot;Fazendo&quot; (início) e
            &quot;Concluído&quot; (fim). Você pode ajustar manualmente quando precisar.
          </p>

          <div className="space-y-2">
            <Label>Etiquetas (separe por vírgula)</Label>
            <Input value={labelsInput} onChange={(event) => setLabelsInput(event.target.value)} placeholder="Frontend, Urgente" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-3 text-sm focus:border-blue-500 dark:focus:border-blue-600 focus:outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhe a tarefa, critérios de aceite, links úteis..."
            />
          </div>

          <div>
            <Label>Checklist</Label>
            <div className="mt-3 space-y-2">
              {checklist.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item adicionado</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChecklistReorder}>
                  <SortableContext items={checklist.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {checklist.map((item) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        onToggle={toggleChecklistItem}
                        onRemove={handleRemoveChecklistItem}
                        onChangeTitle={updateChecklistItemTitle}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={checklistItem} onChange={(event) => setChecklistItem(event.target.value)} placeholder="Adicionar item" />
              <Button type="button" variant="outline" onClick={handleAddChecklistItem}>
                <Plus className="mr-2 h-4 w-4" />
                Inserir
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              {isEditing && onDeleteTask && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)} 
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir tarefa'}
                </Button>
              )}
              {isEditing && task && (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowMoveModal(true)}
                    className="gap-2"
                  >
                    <MoveRight className="h-4 w-4" />
                    Mover para outro quadro
                  </Button>
                  {onCloneTask && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        onCloneTask(task)
                        onClose()
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Clonar tarefa
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar tarefa'}
              </Button>
            </div>
          </div>
        </form>
        
        {/* Modal de mover para outro quadro */}
        {isEditing && task && showMoveModal && (
          <MoveTaskModal
            open={showMoveModal}
            onClose={() => {
              setShowMoveModal(false)
              onClose() // Fechar o modal da tarefa também após mover
            }}
            task={task}
          />
        )}

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteTask}
          title="Excluir tarefa"
          description="Deseja realmente excluir esta tarefa? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}

interface ChecklistItemRowProps {
  item: TaskChecklistItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onChangeTitle: (id: string, title: string) => void
}

function ChecklistItemRow({ item, onToggle, onRemove, onChangeTitle }: ChecklistItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-gray-400"
        aria-label="Reordenar item"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
          item.done ? 'border-green-500 dark:border-green-600 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
        }`}
        onClick={() => onToggle(item.id)}
        aria-pressed={item.done}
      >
        {item.done && <Check className="h-4 w-4" />}
      </button>
      <Input
        value={item.title}
        onChange={(event) => onChangeTitle(item.id, event.target.value)}
        className={`flex-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white ${item.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}
        placeholder="Descrição do item"
      />
      <button type="button" onClick={() => onRemove(item.id)} aria-label="Remover item">
        <Trash2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </button>
    </div>
  )
}
