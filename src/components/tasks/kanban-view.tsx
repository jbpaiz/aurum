'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Kanban, Columns2, Search, Filter, List as ListIcon, BarChart3, MoreHorizontal, Maximize2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTasks } from '@/contexts/tasks-context'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskModal } from '@/components/tasks/task-modal'
import { TaskListView } from '@/components/tasks/task-list-view'
import { KanbanMetrics } from '@/components/tasks/kanban-metrics'
import { BoardManagementView } from '@/components/tasks/board-management-view'
import { FiltersModal } from '@/components/tasks/filters-modal'
import { CloneTaskModal } from '@/components/tasks/clone-task-modal'
import type { CreateTaskInput, TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { useUserPreferences } from '@/hooks/use-user-preferences'

export function KanbanView() {
  const {
    loading,
    activeProject,
    activeBoard,
    priorityField,
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
  const { preferences, updatePreferences, loading: preferencesLoading } = useUserPreferences()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null)
  const [taskToClone, setTaskToClone] = useState<TaskCard | null>(null)
  const [columnIdForModal, setColumnIdForModal] = useState<string | undefined>()
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  
  // Inicializar estados com preferências do banco ou localStorage
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'metrics'>('kanban')
  const [adaptiveWidth, setAdaptiveWidth] = useState<boolean>(false)
  const [adaptiveWidthList, setAdaptiveWidthList] = useState<boolean>(false)
  
  const managerParam = searchParams.get('manager')

  // Carregar preferências iniciais APENAS UMA VEZ quando carregarem
  useEffect(() => {
    if (!preferencesLoading && preferences && !preferencesLoaded) {
      setViewMode(preferences.tasksViewMode)
      setAdaptiveWidth(preferences.tasksAdaptiveWidth)
      setAdaptiveWidthList(preferences.tasksAdaptiveWidthList)
      
      // Restaurar último quadro acessado
      if (preferences.activeBoardId && activeProject) {
        const boardExists = activeProject.boards.some(b => b.id === preferences.activeBoardId)
        if (boardExists && activeBoard?.id !== preferences.activeBoardId) {
          setActiveBoardId(preferences.activeBoardId)
        }
      }
      
      // Marcar como carregado ANTES do próximo render
      setPreferencesLoaded(true)
    }
  }, [preferences, preferencesLoading, preferencesLoaded, activeProject, activeBoard, setActiveBoardId])

  // Salvar último quadro acessado quando mudar (COM DEBOUNCE)
  useEffect(() => {
    // Esperar preferências carregarem completamente
    if (!preferences || preferencesLoading || !activeBoard) {
      return
    }
    
    // Só salvar se o quadro mudou
    if (preferences.activeBoardId === activeBoard.id) {
      return
    }

    // Debounce de 300ms para evitar salvamentos múltiplos
    const timer = setTimeout(() => {
      updatePreferences({ 
        activeBoardId: activeBoard.id,
        activeProjectId: activeProject?.id 
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [activeBoard?.id, activeProject?.id, preferences?.activeBoardId, preferencesLoading, updatePreferences])

  // Atualizar preferências APENAS quando o USUÁRIO mudar (não durante carregamento)
  useEffect(() => {
    if (typeof window === 'undefined' || !preferencesLoaded || preferencesLoading) return
    
    if (preferences) {
      // Só atualiza se o valor for diferente
      if (preferences.tasksViewMode !== viewMode) {
        updatePreferences({ tasksViewMode: viewMode })
      }
    } else {
      // Fallback para localStorage
      window.localStorage.setItem('aurum.tasks.viewMode', viewMode)
    }
  }, [viewMode])

  useEffect(() => {
    if (typeof window === 'undefined' || !preferencesLoaded || preferencesLoading) return
    
    if (preferences) {
      if (preferences.tasksAdaptiveWidth !== adaptiveWidth) {
        updatePreferences({ tasksAdaptiveWidth: adaptiveWidth })
      }
    } else {
      window.localStorage.setItem('aurum.tasks.adaptiveWidth', String(adaptiveWidth))
    }
  }, [adaptiveWidth])

  useEffect(() => {
    if (typeof window === 'undefined' || !preferencesLoaded || preferencesLoading) return
    
    if (preferences) {
      if (preferences.tasksAdaptiveWidthList !== adaptiveWidthList) {
        updatePreferences({ tasksAdaptiveWidthList: adaptiveWidthList })
      }
    } else {
      window.localStorage.setItem('aurum.tasks.adaptiveWidthList', String(adaptiveWidthList))
    }
  }, [adaptiveWidthList])

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
      const matchesSearch = search
        ? task.title.toLowerCase().includes(search) ||
          task.subtitle?.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
        : true
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

  const openCloneTaskModal = (task: TaskCard) => {
    setTaskToClone(task)
    setIsCloneModalOpen(true)
  }

  const handleConfirmClone = async (payload: CreateTaskInput) => {
    await createTask(payload)
  }

  // Obter todas as keys existentes para validação
  const existingKeys = useMemo(() => {
    if (!activeBoard) return []
    return activeBoard.columns.flatMap(col => col.tasks.map(task => task.key))
  }, [activeBoard])

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
    <div className="flex flex-col gap-3 p-0 md:gap-3 md:p-0">
      {/* Header moderno com gradiente sutil */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/50 bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 shadow-sm backdrop-blur-sm">
        {/* Decoração de fundo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent dark:from-blue-500/10 dark:via-purple-500/10 pointer-events-none" />
        
        <div className="relative p-4 sm:p-5 space-y-4">
          {/* Linha 1: Título com dropdown de quadros e Ações */}
          <div className="flex items-center justify-between gap-4">
            {/* Título clicável com dropdown de quadros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 flex-shrink-0 hover:bg-white/60 dark:hover:bg-gray-700/50 rounded-xl px-3 py-2 -ml-2 transition-all duration-200 group ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                    <Kanban className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {activeBoard?.name ?? 'Kanban'}
                    </h1>
                    <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">
                      {activeTasksCount}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {activeProject?.boards.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onSelect={() => setActiveBoardId(board.id)}
                    className={board.id === activeBoard?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    <Kanban className="h-4 w-4 mr-2" />
                    {board.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botões de ação */}
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={() => openCreateTaskModal()} size="sm" className="gap-2 h-10 px-4 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <span className="hidden sm:inline font-semibold">Nova tarefa</span>
                <span className="sm:hidden font-semibold">Nova</span>
              </Button>
              {activeBoard && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
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
                    {viewMode === 'kanban' && (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Largura adaptável</span>
                          <Switch
                            checked={adaptiveWidth}
                            onCheckedChange={setAdaptiveWidth}
                          />
                        </div>
                      </DropdownMenuItem>
                    )}
                    {viewMode === 'list' && (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Largura adaptável</span>
                          <Switch
                            checked={adaptiveWidthList}
                            onCheckedChange={setAdaptiveWidthList}
                          />
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Linha 2: Modos de Visualização e Filtros */}
          <div className="flex items-center justify-between gap-4">
            {/* Modos de visualização com design pill moderno */}
            <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100/80 dark:bg-gray-900/50 p-1.5 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className={`relative rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'kanban' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md hover:shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Quadro</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={`relative rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md hover:shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={viewMode === 'metrics' ? 'default' : 'ghost'}
                size="sm"
                className={`relative rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'metrics' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md hover:shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setViewMode('metrics')}
              >
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Métricas</span>
              </Button>
            </div>

            {/* Botão de filtros premium */}
            <Button 
              variant={hasActiveFilters ? "default" : "outline"} 
              onClick={() => setIsFiltersModalOpen(true)}
              size="sm"
              className={`gap-2 h-10 px-4 font-medium shadow-sm transition-all duration-200 ${
                hasActiveFilters 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs font-semibold bg-white/20 text-white border-0">
                  Ativos
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Carregando quadro...</p>
        </div>
      ) : filteredColumns.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Crie sua primeira tarefa</p>
          <Button onClick={() => openCreateTaskModal()}>Adicionar tarefa</Button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div 
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto w-full h-[calc(100vh-205px)] [scrollbar-width:thin] [scrollbar-color:#CBD5E1_#F1F5F9] dark:[scrollbar-color:#4B5563_#1F2937]"
        >
          <div className="p-3 sm:p-4 min-w-min h-full">
            <KanbanBoard
              columns={filteredColumns}
              onSelectTask={openEditTaskModal}
              onCreateTask={openCreateTaskModal}
              onToggleChecklistItem={toggleTaskChecklistItem}
              moveTask={moveTask}
              adaptiveWidth={adaptiveWidth}
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
          adaptiveWidth={adaptiveWidthList}
        />
      ) : (
        <KanbanMetrics columns={filteredColumns} priorityField={priorityField} />
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
        onCloneTask={openCloneTaskModal}
      />

      <FiltersModal
        open={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        priorityField={priorityField}
        labelFilter={labelFilter}
        onLabelChange={setLabelFilter}
      />

      {taskToClone && (
        <CloneTaskModal
          open={isCloneModalOpen}
          onClose={() => {
            setIsCloneModalOpen(false)
            setTaskToClone(null)
          }}
          task={taskToClone}
          onConfirm={handleConfirmClone}
          existingKeys={existingKeys}
        />
      )}
    </div>
  )
}

const LabelSeamless = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{children}</span>
)
