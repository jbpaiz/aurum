'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Kanban, Columns2, Search, Filter, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/contexts/tasks-context'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskModal } from '@/components/tasks/task-modal'
import { TaskListView } from '@/components/tasks/task-list-view'
import type { CreateTaskInput, TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_COLORS } from '@/types/tasks'

export function KanbanView() {
  const {
    loading,
    activeProject,
    activeBoard,
    setActiveBoardId,
    createTask,
    updateTask,
    moveTask,
    createColumn,
    createBoard
  } = useTasks()

  const [searchTerm, setSearchTerm] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null)
  const [columnIdForModal, setColumnIdForModal] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    if (typeof window === 'undefined') return 'kanban'
    const stored = window.localStorage.getItem('aurum.tasks.viewMode') as 'kanban' | 'list' | null
    return stored === 'list' ? 'list' : 'kanban'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('aurum.tasks.viewMode', viewMode)
  }, [viewMode])

  const filteredColumns: TaskColumn[] = useMemo(() => {
    if (!activeBoard) return []
    const search = searchTerm.trim().toLowerCase()
    const label = labelFilter.trim().toLowerCase()

    const matchesFilters = (task: TaskCard) => {
      const matchesSearch = search ? task.title.toLowerCase().includes(search) || task.description?.toLowerCase().includes(search) : true
      const matchesPriority = priorityFilter === 'all' ? true : task.priority === priorityFilter
      const matchesLabel = label
        ? task.labels.some((item) => item.toLowerCase().includes(label))
        : true
      return matchesSearch && matchesPriority && matchesLabel
    }

    return activeBoard.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter(matchesFilters)
    }))
  }, [activeBoard, searchTerm, labelFilter, priorityFilter])

  const openCreateTaskModal = (columnId?: string) => {
    setColumnIdForModal(columnId)
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditTaskModal = (task: TaskCard) => {
    setEditingTask(task)
    setColumnIdForModal(task.columnId)
    setIsModalOpen(true)
  }

  const handleSaveTask = async (payload: CreateTaskInput & { id?: string }) => {
    const { id, ...taskPayload } = payload
    if (id) {
      await updateTask(id, taskPayload)
    } else {
      await createTask({ ...taskPayload, columnId: taskPayload.columnId ?? columnIdForModal })
    }
  }

  const handleCreateColumn = async () => {
    const name = window.prompt('Nome da nova coluna (ex: Revisão QA)')
    if (!name) return
    await createColumn(name)
  }

  const handleCreateBoard = async () => {
    const name = window.prompt('Nome do novo quadro (ex: Backlog do Produto)')
    if (!name) return
    await createBoard(name)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Módulo de tarefas</p>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Kanban className="h-6 w-6 text-blue-500" />
              {activeBoard?.name ?? 'Kanban'}
            </div>
            <p className="text-sm text-gray-500">Organize seu fluxo com colunas e cartões no estilo Jira</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCreateBoard}>
              <Columns2 className="h-4 w-4" />
              Novo quadro
            </Button>
            <Button variant="outline" onClick={handleCreateColumn}>
              Nova coluna
            </Button>
            <Button onClick={() => openCreateTaskModal()} className="gap-2">
              Nova tarefa
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_180px]">
          <div className="space-y-1">
            <LabelSeamless>Quadro</LabelSeamless>
            <Select value={activeBoard?.id} onValueChange={setActiveBoardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {activeProject?.boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <LabelSeamless>Buscar</LabelSeamless>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Título ou descrição" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <LabelSeamless>Prioridade</LabelSeamless>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(TASK_PRIORITY_COLORS).map(([value, color]) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {value.toUpperCase()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>Etiquetas:</span>
            <Input
              className="h-8 w-auto min-w-[180px]"
              placeholder="Ex: backend"
              value={labelFilter}
              onChange={(event) => setLabelFilter(event.target.value)}
            />
            <Badge variant="outline" className="bg-gray-50 text-gray-600">
              {activeBoard?.columns.reduce((total, column) => total + column.tasks.length, 0) ?? 0} tarefas ativas
            </Badge>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm font-medium">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className={viewMode === 'kanban' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="mr-2 h-4 w-4" />
              Quadro
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={viewMode === 'list' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="mr-2 h-4 w-4" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-gray-500">Carregando quadro...</p>
        </div>
      ) : filteredColumns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-lg font-semibold text-gray-600">Crie sua primeira tarefa</p>
          <Button onClick={() => openCreateTaskModal()}>Adicionar tarefa</Button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
          <KanbanBoard
            columns={filteredColumns}
            onSelectTask={openEditTaskModal}
            onCreateTask={openCreateTaskModal}
            moveTask={moveTask}
          />
        </div>
      ) : (
        <TaskListView columns={filteredColumns} onSelectTask={openEditTaskModal} onCreateTask={() => openCreateTaskModal()} />
      )}

      <TaskModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        columns={activeBoard?.columns ?? []}
        defaultColumnId={columnIdForModal}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  )
}

const LabelSeamless = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{children}</span>
)
