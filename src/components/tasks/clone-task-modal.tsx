'use client'

import { useEffect, useState } from 'react'
import { Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TaskCard, CreateTaskInput } from '@/types/tasks'

interface CloneTaskModalProps {
  open: boolean
  onClose: () => void
  task: TaskCard
  onConfirm: (payload: CreateTaskInput) => Promise<void>
  existingKeys: string[]
}

export function CloneTaskModal({ open, onClose, task, onConfirm, existingKeys }: CloneTaskModalProps) {
  const [taskKey, setTaskKey] = useState('')
  const [title, setTitle] = useState('')
  const [isCloning, setIsCloning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Inicializar com valores vazios para o usuário preencher
      setTaskKey('')
      setTitle('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!taskKey.trim()) {
      setError('O código da tarefa é obrigatório')
      return
    }

    if (!title.trim()) {
      setError('O título da tarefa é obrigatório')
      return
    }

    // Verificar se o código já existe
    if (existingKeys.includes(taskKey.trim())) {
      setError('Este código já está em uso. Escolha outro código.')
      return
    }

    // Verificar se é o mesmo código da tarefa original
    if (taskKey.trim() === task.key) {
      setError('O código não pode ser igual ao da tarefa original')
      return
    }

    setIsCloning(true)
    try {
      // Criar payload com os dados da tarefa original + novos key e title
      const payload: CreateTaskInput = {
        key: taskKey.trim(),
        title: title.trim(),
        description: task.description || undefined,
        columnId: task.columnId,
        priority: task.priority,
        type: task.type,
        startDate: task.startDate,
        endDate: task.endDate,
        labels: task.labels,
        checklist: task.checklist
      }

      await onConfirm(payload)
      onClose()
    } catch (err) {
      setError('Erro ao clonar tarefa. Tente novamente.')
    } finally {
      setIsCloning(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clonar Tarefa</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clonando: {task.key}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clone-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Novo Código <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clone-key"
              value={taskKey}
              onChange={(e) => setTaskKey(e.target.value)}
              placeholder="Ex: AUR-123"
              className="dark:bg-gray-900 dark:border-gray-700"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Digite um código único para a nova tarefa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clone-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Novo Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da nova tarefa"
              className="dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              A nova tarefa manterá: descrição, prioridade, tipo, etiquetas, checklist e datas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isCloning}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCloning}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {isCloning ? 'Clonando...' : 'Clonar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
