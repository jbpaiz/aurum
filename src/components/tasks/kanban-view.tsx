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
import { FiltersModal } from '@/components/tasks/filters-modal'
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
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
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

  const activeTasksCount = activeBoard?.columns.reduce((total, column) => total + column.tasks.length, 0) ?? 0
  const hasActiveFilters = searchTerm || priorityFilter !== 'all' || labelFilter

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
        {/* Header com título e ações */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">Módulo de tarefas</p>
            <div className="flex items-center gap-2">
              <Kanban className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">{activeBoard?.name ?? 'Kanban'}</h1>
              <Badge variant="outline" className="text-sm font-medium text-gray-600">
                {activeTasksCount} tarefas ativas
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
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

        {/* Seletor de quadro e filtros */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 max-w-md">
            <Select value={activeBoard?.id} onValueChange={setActiveBoardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o quadro" />
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

          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            onClick={() => setIsFiltersModalOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                Ativos
              </Badge>
            )}
          </Button>
        </div>

        {/* Modos de visualização */}
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-gray-100 p-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            className={`flex-1 rounded-lg ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            onClick={() => setViewMode('kanban')}
          >
            <Kanban className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Quadro</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`flex-1 rounded-lg ${viewMode === 'list' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
          <Button
            variant={viewMode === 'metrics' ? 'default' : 'ghost'}
            size="sm"
            className={`flex-1 rounded-lg ${viewMode === 'metrics' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
            onClick={() => setViewMode('metrics')}
          >
            <BarChart3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Métricas</span>
          </Button>
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

      <FiltersModal
        open={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        labelFilter={labelFilter}
        onLabelChange={setLabelFilter}
      />
    </div>
  )
}

const LabelSeamless = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{children}</span>
)
