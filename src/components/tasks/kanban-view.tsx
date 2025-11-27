'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Kanban, Columns2, Search, Filter, List as ListIcon, BarChart3, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTasks } from '@/contexts/tasks-context'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskModal } from '@/components/tasks/task-modal'
import { TaskListView } from '@/components/tasks/task-list-view'
import { KanbanMetrics } from '@/components/tasks/kanban-metrics'
import { BoardManagementView } from '@/components/tasks/board-management-view'
import type { CreateTaskInput, TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'

export function KanbanView() {
  const {
    loading,
    activeProject,
    activeBoard,
    setActiveBoardId,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskChecklistItem,
    createColumn,
    createBoard
  } = useTasks()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null)
  const [columnIdForModal, setColumnIdForModal] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'metrics'>(() => {
    if (typeof window === 'undefined') return 'kanban'
    const stored = window.localStorage.getItem('aurum.tasks.viewMode') as 'kanban' | 'list' | 'metrics' | null
    return stored === 'list' || stored === 'metrics' ? stored : 'kanban'
  })
  const managerParam = searchParams.get('manager')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('aurum.tasks.viewMode', viewMode)
  }, [viewMode])

  const showManagerView = managerParam === '1'

  const updateManagerVisibility = (open: boolean) => {
    if (!router || !pathname) return

    const params = new URLSearchParams(searchParams.toString())
    if (open) {
      params.set('manager', '1')
    } else {
      params.delete('manager')
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

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

  const handleChangeTaskColumn = async (taskId: string, targetColumnId: string) => {
    await updateTask(taskId, { columnId: targetColumnId })
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

  if (showManagerView) {
    return (
      <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
        <BoardManagementView onBack={() => updateManagerVisibility(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Módulo de tarefas</p>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Kanban className="h-6 w-6 text-blue-500" />
              {activeBoard?.name ?? 'Kanban'}
            </div>
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
            {activeBoard && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Opções do quadro</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      updateManagerVisibility(true)
                    }}
                  >
                    Gerenciar quadros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_200px]">
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
                      {TASK_PRIORITY_LABELS[value as TaskPriority]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            <Button
              variant={viewMode === 'metrics' ? 'default' : 'ghost'}
              size="sm"
              className={viewMode === 'metrics' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}
              onClick={() => setViewMode('metrics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Métricas
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-gray-500">Carregando quadro...</p>
        </div>
      ) : filteredColumns.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-lg font-semibold text-gray-600">Crie sua primeira tarefa</p>
          <Button onClick={() => openCreateTaskModal()}>Adicionar tarefa</Button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="w-full rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-auto p-3 sm:p-4">
            <KanbanBoard
              columns={filteredColumns}
              onSelectTask={openEditTaskModal}
              onCreateTask={openCreateTaskModal}
              onToggleChecklistItem={toggleTaskChecklistItem}
              moveTask={moveTask}
            />
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <TaskListView
          columns={filteredColumns}
          referenceColumns={activeBoard?.columns ?? []}
          onSelectTask={openEditTaskModal}
          onCreateTask={() => openCreateTaskModal()}
          onChangeTaskColumn={handleChangeTaskColumn}
        />
      ) : (
        <KanbanMetrics columns={filteredColumns} />
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
        onDeleteTask={deleteTask}
      />
    </div>
  )
}

const LabelSeamless = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{children}</span>
)
