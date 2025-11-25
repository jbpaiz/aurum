'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  CreateTaskInput,
  TaskAttachmentMeta,
  TaskCard,
  TaskChecklistItem,
  TaskColumn,
  TaskPriority,
  TaskType
} from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  columns: TaskColumn[]
  defaultColumnId?: string
  task?: TaskCard | null
  onSave: (payload: CreateTaskInput & { id?: string }) => Promise<void>
  onDeleteTask?: (taskId: string) => Promise<void>
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Tarefa' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'História' },
  { value: 'epic', label: 'Épico' }
]

export function TaskModal({ open, onClose, columns, defaultColumnId, task, onSave, onDeleteTask }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [type, setType] = useState<TaskType>('task')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [labelsInput, setLabelsInput] = useState('')
  const [attachments, setAttachments] = useState<TaskAttachmentMeta[]>([])
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([])
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [checklistItem, setChecklistItem] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isEditing = Boolean(task)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setColumnId(task?.columnId ?? defaultColumnId ?? columns[0]?.id ?? '')
    setPriority(task?.priority ?? 'medium')
    setType(task?.type ?? 'task')
    setStartDate(task?.startDate ?? '')
    setEndDate(task?.endDate ?? '')
    setLabelsInput(task?.labels?.join(', ') ?? '')
    setAttachments(task?.attachments ?? [])
    setChecklist(task?.checklist ?? [])
    setAttachmentName('')
    setAttachmentUrl('')
    setChecklistItem('')
    setFormError(null)
  }, [open, task, columns, defaultColumnId])

  const labels = useMemo(
    () =>
      labelsInput
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    [labelsInput]
  )

  const randomId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 12)
  }

  const handleAddAttachment = () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) return
    setAttachments((prev) => [
      ...prev,
      {
        id: randomId(),
        name: attachmentName.trim(),
        url: attachmentUrl.trim()
      }
    ])
    setAttachmentName('')
    setAttachmentUrl('')
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
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

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setFormError('Informe um título para a tarefa.')
      return
    }
    const resolvedColumnId = columnId || task?.columnId || defaultColumnId || columns[0]?.id || ''
    if (!resolvedColumnId) {
      setFormError('Selecione a coluna antes de salvar.')
      return
    }
    setFormError(null)

    setIsSaving(true)
    await onSave({
      id: task?.id,
      title: title.trim(),
      description,
      columnId: resolvedColumnId,
      priority,
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      labels,
      attachments,
      checklist
    })
    setIsSaving(false)
    onClose()
  }

  const handleDeleteTask = async () => {
    if (!task?.id || !onDeleteTask) return
    const confirmed = window.confirm('Deseja realmente excluir esta tarefa? Esta ação não pode ser desfeita.')
    if (!confirmed) return
    try {
      setIsDeleting(true)
      await onDeleteTask(task.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</h2>
            <p className="text-sm text-gray-500">Defina título, prioridade, etiquetas e anexos</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Implementar fluxo de onboarding" />
            </div>
            <div className="space-y-2">
              <Label>Coluna</Label>
              <Select value={columnId || task?.columnId || defaultColumnId || columns[0]?.id || ''} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TASK_PRIORITY_COLORS).map((value) => (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: TASK_PRIORITY_COLORS[value as TaskPriority] }}
                        />
                        {TASK_PRIORITY_LABELS[value as TaskPriority]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <p className="text-xs text-gray-500">
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
              className="min-h-[120px] w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhe a tarefa, critérios de aceite, links úteis..."
            />
          </div>

          <div>
            <Label>Anexos</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
                >
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600">
                    {attachment.name}
                  </a>
                  <button type="button" onClick={() => handleRemoveAttachment(attachment.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Input value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} placeholder="Nome" />
              <Input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="URL https://" />
              <Button type="button" variant="outline" onClick={handleAddAttachment}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <Label>Checklist</Label>
            <div className="mt-3 space-y-2">
              {checklist.length === 0 && <p className="text-sm text-gray-500">Nenhum item adicionado</p>}
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <button
                    type="button"
                    className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      item.done ? 'border-green-500 bg-green-100 text-green-600' : 'border-gray-300 text-gray-400'
                    }`}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    {item.done && <Check className="h-4 w-4" />}
                  </button>
                  <span className={`flex-1 text-left ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.title}</span>
                  <button type="button" onClick={() => handleRemoveChecklistItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
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
            {isEditing && onDeleteTask ? (
              <Button type="button" variant="destructive" onClick={handleDeleteTask} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir tarefa'}
              </Button>
            ) : <span />}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar tarefa'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
