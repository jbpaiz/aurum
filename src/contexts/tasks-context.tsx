'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/lib/database.types'
import { useAuth } from '@/contexts/auth-context'
import type {
  CreateTaskInput,
  MoveTaskPayload,
  TaskBoard,
  TaskCard,
  TaskColumn,
  TaskComment,
  TaskProject,
  TaskSprint,
  TaskAttachmentMeta,
  TaskChecklistItem,
  TaskColumnCategory,
  TaskPriority,
  TaskType
} from '@/types/tasks'
import { TASK_COLUMN_COLOR_PALETTE } from '@/types/tasks'

type ProjectRow = Database['public']['Tables']['task_projects']['Row']
type BoardRow = Database['public']['Tables']['task_boards']['Row']
type ColumnRow = Database['public']['Tables']['task_columns']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type CommentRow = Database['public']['Tables']['task_comments']['Row']
type SprintRow = Database['public']['Tables']['task_sprints']['Row']

type ProjectWithRelations = ProjectRow & {
  task_boards: (BoardRow & {
    task_columns: (ColumnRow & {
      tasks: (TaskRow & {
        task_comments: CommentRow[] | null
      })[] | null
    })[] | null
    task_sprints: SprintRow[] | null
  })[] | null
}

interface TasksContextValue {
  loading: boolean
  projects: TaskProject[]
  activeProject?: TaskProject
  activeBoard?: TaskBoard
  setActiveProjectId: (projectId: string) => void
  setActiveBoardId: (boardId: string) => void
  createTask: (input: CreateTaskInput) => Promise<void>
  updateTask: (taskId: string, updates: Partial<CreateTaskInput>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  moveTask: (payload: MoveTaskPayload) => Promise<void>
  toggleTaskChecklistItem: (taskId: string, checklistItemId: string, done: boolean) => Promise<void>
  createColumn: (name: string, category?: TaskColumnCategory, color?: string) => Promise<void>
  createBoard: (name: string, description?: string) => Promise<void>
  renameBoard: (boardId: string, name: string) => Promise<void>
  deleteBoard: (boardId: string) => Promise<void>
  renameColumn: (columnId: string, name: string) => Promise<void>
  deleteColumn: (columnId: string) => Promise<void>
  updateColumnColor: (columnId: string, color: string) => Promise<void>
  reorderColumns: (orderedIds: string[]) => Promise<void>
  refresh: () => Promise<void>
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined)

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 12)
}

const PRIORITY_VALUES: TaskPriority[] = ['lowest', 'low', 'medium', 'high', 'highest']
const PRIORITY_ALIASES: Record<string, TaskPriority> = {
  urgente: 'highest',
  urgent: 'highest',
  critical: 'highest',
  critica: 'highest',
  alta: 'high',
  alto: 'high',
  media: 'medium',
  médio: 'medium',
  medio: 'medium',
  baixa: 'low',
  baixo: 'low',
  baixissima: 'lowest',
  'muito baixa': 'lowest'
}

const normalizePriority = (value?: string | null): TaskPriority => {
  if (!value) return 'medium'
  const normalized = value.toLowerCase().trim()
  if (PRIORITY_VALUES.includes(normalized as TaskPriority)) {
    return normalized as TaskPriority
  }
  return PRIORITY_ALIASES[normalized] ?? 'medium'
}

const TYPE_VALUES: TaskType[] = ['task', 'bug', 'story', 'epic']
const TYPE_ALIASES: Record<string, TaskType> = {
  tarefa: 'task',
  historia: 'story',
  história: 'story',
  epico: 'epic',
  épico: 'epic'
}

const normalizeType = (value?: string | null): TaskType => {
  if (!value) return 'task'
  const normalized = value.toLowerCase().trim()
  if (TYPE_VALUES.includes(normalized as TaskType)) {
    return normalized as TaskType
  }
  return TYPE_ALIASES[normalized] ?? 'task'
}

const toAttachmentArray = (value: Json | undefined | null): TaskAttachmentMeta[] => {
  if (!value || !Array.isArray(value)) return []
  return value.reduce<TaskAttachmentMeta[]>((acc, item) => {
    if (typeof item !== 'object' || item === null) return acc
    const record = item as Record<string, unknown>
    const url = typeof record.url === 'string' ? record.url : ''
    if (!url) return acc
    acc.push({
      id: typeof record.id === 'string' ? record.id : randomId(),
      name: typeof record.name === 'string' ? record.name : 'Anexo',
      url,
      type: typeof record.type === 'string' ? record.type : undefined
    })
    return acc
  }, [])
}

const toChecklistArray = (value: Json | undefined | null): TaskChecklistItem[] => {
  if (!value || !Array.isArray(value)) return []
  return value.reduce<TaskChecklistItem[]>((acc, item) => {
    if (typeof item !== 'object' || item === null) return acc
    const record = item as Record<string, unknown>
    const title = typeof record.title === 'string' ? record.title : ''
    if (!title) return acc
    acc.push({
      id: typeof record.id === 'string' ? record.id : randomId(),
      title,
      done: typeof record.done === 'boolean' ? record.done : false
    })
    return acc
  }, [])
}

const mapComment = (row: CommentRow): TaskComment => ({
  id: row.id,
  taskId: row.task_id,
  userId: row.user_id,
  body: row.body,
  attachments: toAttachmentArray(row.attachments),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapTask = (row: TaskRow & { task_comments?: CommentRow[] | null }): TaskCard => ({
  id: row.id,
  key: row.key,
  projectId: row.project_id,
  boardId: row.board_id,
  columnId: row.column_id,
  sprintId: row.sprint_id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  type: normalizeType(row.type),
  priority: normalizePriority(row.priority),
  reporterId: row.reporter_id,
  assigneeId: row.assignee_id,
  startDate: row.start_date,
  endDate: row.due_date,
  labels: row.labels ?? [],
  attachments: toAttachmentArray(row.attachments),
  checklist: toChecklistArray(row.checklist),
  isBlocked: row.is_blocked,
  blockedReason: row.blocked_reason,
  storyPoints: row.story_points ?? null,
  estimateHours: row.estimate_hours ?? null,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  comments: (row.task_comments ?? []).map(mapComment)
})

const mapColumn = (
  row: ColumnRow & { tasks?: (TaskRow & { task_comments?: CommentRow[] | null })[] | null }
): TaskColumn => ({
  id: row.id,
  boardId: row.board_id,
  name: row.name,
  slug: row.slug,
  category: row.category,
  color: row.color,
  wipLimit: row.wip_limit,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  tasks: (row.tasks ?? [])
    .map(mapTask)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const mapSprint = (row: SprintRow): TaskSprint => ({
  id: row.id,
  projectId: row.project_id,
  boardId: row.board_id,
  name: row.name,
  goal: row.goal,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapBoard = (
  row: BoardRow & {
    task_columns?: (ColumnRow & { tasks?: (TaskRow & { task_comments?: CommentRow[] | null })[] | null })[] | null
    task_sprints?: SprintRow[] | null
  }
): TaskBoard => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  description: row.description,
  viewMode: row.view_mode,
  swimlaneMode: row.swimlane_mode,
  filter: (row.filter as Record<string, unknown>) ?? {},
  isDefault: row.is_default,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  columns: (row.task_columns ?? [])
    .map(mapColumn)
    .sort((a, b) => a.position - b.position),
  sprints: (row.task_sprints ?? []).map(mapSprint)
})

const mapProject = (row: ProjectWithRelations): TaskProject => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  code: row.code,
  description: row.description,
  color: row.color,
  icon: row.icon,
  issueCounter: row.issue_counter,
  sortOrder: row.sort_order,
  isFavorite: row.is_favorite,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  boards: (row.task_boards ?? [])
    .map(mapBoard)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)

const pickNextColumnColor = (columns?: TaskColumn[], fallback?: string) => {
  if (fallback) return fallback
  const used = new Set((columns ?? []).map((column) => column.color?.toLowerCase() ?? ''))
  const available = TASK_COLUMN_COLOR_PALETTE.find((color) => !used.has(color.toLowerCase()))
  if (available) return available
  const index = (columns?.length ?? 0) % TASK_COLUMN_COLOR_PALETTE.length
  return TASK_COLUMN_COLOR_PALETTE[index]
}

const getLastColumnId = (board?: TaskBoard | null): string | null => {
  if (!board || !board.columns.length) return null
  const sortedColumns = [...board.columns].sort((a, b) => {
    const aPosition = a.position ?? board.columns.indexOf(a)
    const bPosition = b.position ?? board.columns.indexOf(b)
    if (aPosition === bPosition) {
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    }
    return aPosition - bPosition
  })
  return sortedColumns[sortedColumns.length - 1]?.id ?? null
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de TasksProvider')
  }
  return context
}

interface TasksProviderProps {
  children: React.ReactNode
}

export function TasksProvider({ children }: TasksProviderProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<TaskProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const creatingDefaultRef = useRef(false)

  const updateBoardState = useCallback(
    (boardId: string, updater: (board: TaskBoard) => TaskBoard) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          const hasBoard = project.boards.some((board) => board.id === boardId)
          if (!hasBoard) return project
          return {
            ...project,
            boards: project.boards.map((board) => (board.id === boardId ? updater(board) : board))
          }
        })
      )
    },
    [setProjects]
  )

  const createDefaultWorkspace = useCallback(async () => {
    if (!user || creatingDefaultRef.current) return false
    creatingDefaultRef.current = true

    const baseCode = 'AUR'
    let code = baseCode

    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (attempt > 0) {
          code = `${baseCode}${Math.floor(Math.random() * 900 + 100)}`
        }

        const { data: project, error: projectError } = await supabase
          .from('task_projects')
          .insert({
            user_id: user.id,
            name: 'Projeto Pessoal',
            code: code.toUpperCase(),
            description: 'Projeto padrão para o módulo de tarefas',
            color: '#2563EB',
            icon: '📋',
            is_favorite: true
          })
          .select()
          .single()

        if (projectError) {
          if (projectError.code === '23505') {
            continue
          }
          console.error('Erro ao criar projeto padrão:', projectError.message)
          return false
        }

        const { error: boardError } = await supabase
          .from('task_boards')
          .insert({
            project_id: project.id,
            name: 'Kanban Principal',
            description: 'Fluxo padrão (A Fazer → Fazendo → Aguardando → Concluído)',
            is_default: true
          })

        if (boardError) {
          console.error('Erro ao criar quadro padrão:', boardError.message)
          return false
        }

        return true
      }
    } finally {
      creatingDefaultRef.current = false
    }

    return false
  }, [user])

  const fetchWorkspace = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!user) {
      setProjects([])
      setActiveProjectId(null)
      setActiveBoardId(null)
      setLoading(false)
      return
    }

    if (!silent) {
      setLoading(true)
    }

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data, error } = await supabase
          .from('task_projects')
          .select(`
            *,
            task_boards (
              *,
              task_sprints (*),
              task_columns (
                *,
                tasks (
                  *,
                  task_comments (*)
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .order('sort_order', { ascending: true, referencedTable: 'task_boards' })
          .order('position', { ascending: true, referencedTable: 'task_boards.task_columns' })
          .order('sort_order', { ascending: true, referencedTable: 'task_boards.task_columns.tasks' })

        if (error) {
          console.error('Erro ao carregar quadros de tarefas:', error.message)
          return
        }

        if (!data || data.length === 0) {
          if (attempt === 0) {
            const created = await createDefaultWorkspace()
            if (created) {
              continue
            }
          }
          setProjects([])
          setActiveProjectId(null)
          setActiveBoardId(null)
          return
        }

        const projectList = data.map(mapProject)
        setProjects(projectList)

        const nextProjectId = projectList.some((project) => project.id === activeProjectId)
          ? activeProjectId
          : projectList[0]?.id ?? null
        setActiveProjectId(nextProjectId)

        const currentProject = projectList.find((project) => project.id === nextProjectId)

        if (currentProject) {
          const nextBoardId = currentProject.boards.some((board) => board.id === activeBoardId)
            ? activeBoardId
            : currentProject.boards[0]?.id ?? null
          setActiveBoardId(nextBoardId ?? null)
        } else {
          setActiveBoardId(null)
        }

        return
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [user, activeProjectId, activeBoardId, createDefaultWorkspace])

  useEffect(() => {
    fetchWorkspace()
  }, [fetchWorkspace])

  const activeProject = useMemo(() => {
    if (!projects.length) return undefined
    return projects.find((project) => project.id === activeProjectId) ?? projects[0]
  }, [projects, activeProjectId])

  const activeBoard = useMemo(() => {
    if (!activeProject) return undefined
    return activeProject.boards.find((board) => board.id === activeBoardId) ?? activeProject.boards[0]
  }, [activeProject, activeBoardId])

  const refresh = useCallback(async () => {
    await fetchWorkspace()
  }, [fetchWorkspace])

  const buildTaskPayload = (
    input: Partial<CreateTaskInput>
  ): Partial<Database['public']['Tables']['tasks']['Insert']> => {
    const payload: Partial<Database['public']['Tables']['tasks']['Insert']> = {}
    if (input.title !== undefined) payload.title = input.title
    if (input.description !== undefined) payload.description = input.description
    if (input.key !== undefined) payload.key = input.key?.trim()
    if (input.priority !== undefined) payload.priority = input.priority
    if (input.type !== undefined) payload.type = input.type
    if (input.startDate !== undefined) payload.start_date = input.startDate
    if (input.endDate !== undefined) payload.due_date = input.endDate
    if (input.labels !== undefined) payload.labels = input.labels
    if (input.attachments !== undefined) payload.attachments = input.attachments as unknown as Json
    if (input.checklist !== undefined) payload.checklist = input.checklist as unknown as Json
    if (input.sprintId !== undefined) payload.sprint_id = input.sprintId
    if (input.assigneeId !== undefined) payload.assignee_id = input.assigneeId
    if (input.storyPoints !== undefined) payload.story_points = input.storyPoints
    if (input.estimateHours !== undefined) payload.estimate_hours = input.estimateHours
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked
    if (input.blockedReason !== undefined) payload.blocked_reason = input.blockedReason
    return payload
  }

  const mergeTaskWithUpdates = (task: TaskCard, updates: Partial<CreateTaskInput>): TaskCard => ({
    ...task,
    title: updates.title ?? task.title,
    description: updates.description ?? task.description,
    key: updates.key ?? task.key,
    priority: updates.priority ?? task.priority,
    type: updates.type ?? task.type,
    startDate: updates.startDate ?? task.startDate,
    endDate: updates.endDate ?? task.endDate,
    labels: updates.labels ?? task.labels,
    checklist: updates.checklist ?? task.checklist,
    sprintId: updates.sprintId ?? task.sprintId,
    assigneeId: updates.assigneeId ?? task.assigneeId,
    attachments: updates.attachments ?? task.attachments,
    storyPoints: updates.storyPoints ?? task.storyPoints,
    estimateHours: updates.estimateHours ?? task.estimateHours,
    isBlocked: updates.isBlocked ?? task.isBlocked,
    blockedReason: updates.blockedReason ?? task.blockedReason,
    columnId: updates.columnId ?? task.columnId,
    boardId: updates.boardId ?? task.boardId
  })

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!user || !activeBoard) return

      const fallbackColumnId = input.columnId ?? activeBoard.columns[0]?.id
      if (!fallbackColumnId) {
        console.error('Nenhuma coluna disponível para criar a tarefa')
        return
      }
      const fallbackColumn = activeBoard.columns.find((column) => column.id === fallbackColumnId)
      const nowDate = new Date().toISOString().split('T')[0]

      const attachments: TaskAttachmentMeta[] = (input.attachments ?? []).map((attachment) => ({
        ...attachment,
        id: attachment.id || randomId()
      }))

      const checklist: TaskChecklistItem[] = (input.checklist ?? []).map((item) => ({
        ...item,
        id: item.id || randomId()
      }))

      const currentTasks = fallbackColumn?.tasks ?? []
      const highestSortOrder = currentTasks.length
        ? Math.max(...currentTasks.map((task) => task.sortOrder || 0))
        : 0
      const nextSortOrder = highestSortOrder + 1000

      const payload: Database['public']['Tables']['tasks']['Insert'] = {
        board_id: input.boardId ?? activeBoard.id,
        column_id: fallbackColumnId,
        title: input.title,
        description: input.description ?? null,
        type: input.type ?? 'task',
        priority: input.priority ?? 'medium',
        start_date:
          input.startDate ?? (fallbackColumn?.category === 'in_progress' ? nowDate : null),
        due_date:
          input.endDate ?? (fallbackColumn?.category === 'done' ? nowDate : null),
        labels: input.labels ?? [],
        attachments: attachments as unknown as Json,
        checklist: checklist as unknown as Json,
        sprint_id: input.sprintId ?? null,
        assignee_id: input.assigneeId ?? user.id,
        reporter_id: user.id,
        story_points: input.storyPoints ?? null,
        estimate_hours: input.estimateHours ?? null,
        is_blocked: input.isBlocked ?? false,
        blocked_reason: input.blockedReason ?? null,
        user_id: user.id,
        sort_order: nextSortOrder
      }

      const { data, error } = await supabase.from('tasks').insert(payload).select('id').single()

      if (error) {
        console.error('Erro ao criar tarefa:', error.message)
      } else {
        const customKey = input.key?.trim()
        if (data?.id && customKey) {
          const { error: keyError } = await supabase.from('tasks').update({ key: customKey }).eq('id', data.id)
          if (keyError) {
            console.error('Erro ao atualizar chave da tarefa:', keyError.message)
          }
        }
        await fetchWorkspace()
      }
    },
    [user, activeBoard, fetchWorkspace]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<CreateTaskInput>) => {
      if (!user) return
      const normalizedUpdates: Partial<CreateTaskInput> = { ...updates }

      const taskSnapshot = activeBoard
        ? activeBoard.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId)
        : undefined

      const payload = buildTaskPayload(updates)
      if (updates.columnId) payload.column_id = updates.columnId
      if (updates.boardId) payload.board_id = updates.boardId

      const targetColumnId = updates.columnId ?? taskSnapshot?.columnId
      const destinationColumn = activeBoard?.columns.find((column) => column.id === targetColumnId)
      const nowDate = new Date().toISOString().split('T')[0]
      const lastColumnId = getLastColumnId(activeBoard)

      const movingToAnotherColumn = Boolean(
        taskSnapshot?.columnId && updates.columnId && updates.columnId !== taskSnapshot.columnId
      )

      if (movingToAnotherColumn && !updates.startDate && !taskSnapshot?.startDate) {
        payload.start_date = nowDate
        normalizedUpdates.startDate = nowDate
      }

      if (
        movingToAnotherColumn &&
        updates.columnId === lastColumnId &&
        !updates.endDate &&
        !taskSnapshot?.endDate
      ) {
        payload.due_date = nowDate
        normalizedUpdates.endDate = nowDate
      }

      const shouldOptimisticMove = Boolean(
        taskSnapshot &&
        activeBoard &&
        updates.columnId &&
        destinationColumn &&
        updates.columnId !== taskSnapshot.columnId
      )

      if (shouldOptimisticMove && destinationColumn) {
        const highestSortOrder = destinationColumn.tasks.length
          ? Math.max(...destinationColumn.tasks.map((task) => task.sortOrder ?? 0))
          : 0
        const nextSortOrder = highestSortOrder + 100
        payload.sort_order = nextSortOrder

        updateBoardState(activeBoard!.id, (board) => {
          const columns = board.columns.map((column) => {
            if (column.id === taskSnapshot!.columnId) {
              return {
                ...column,
                tasks: column.tasks.filter((task) => task.id !== taskId)
              }
            }

            if (column.id === destinationColumn.id) {
              const updatedTask = mergeTaskWithUpdates(
                {
                  ...taskSnapshot!,
                  columnId: destinationColumn.id,
                  sortOrder: nextSortOrder
                },
                normalizedUpdates
              )
              return {
                ...column,
                tasks: [...column.tasks, updatedTask]
              }
            }

            return column
          })

          return {
            ...board,
            columns
          }
        })

        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', taskId)

        if (error) {
          console.error('Erro ao atualizar tarefa:', error.message)
          await fetchWorkspace()
          return
        }

        await fetchWorkspace({ silent: true })
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskId)

      if (error) {
        console.error('Erro ao atualizar tarefa:', error.message)
      } else {
        if (taskSnapshot && activeBoard) {
          updateBoardState(activeBoard.id, (board) => ({
            ...board,
            columns: board.columns.map((column) => {
              if (column.id !== taskSnapshot.columnId) return column
              return {
                ...column,
                tasks: column.tasks.map((task) =>
                  task.id === taskId ? mergeTaskWithUpdates(task, normalizedUpdates) : task
                )
              }
            })
          }))
        }
        await fetchWorkspace()
      }
    },
    [user, fetchWorkspace, activeBoard, updateBoardState]
  )

  const normalizeColumnOrders = useCallback(
    async (column: TaskColumn) => {
      const ordered = [...column.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
      const updates = ordered.map((task, index) => ({
        id: task.id,
        sort_order: (index + 1) * 1000
      }))
      if (!updates.length) return
      await supabase.from('tasks').upsert(updates as unknown as Database['public']['Tables']['tasks']['Insert'][])
    },
    []
  )

  const moveTask = useCallback(
    async ({ taskId, sourceColumnId, targetColumnId, targetIndex }: MoveTaskPayload) => {
      if (!activeBoard) return
      const destinationColumn = activeBoard.columns.find((column) => column.id === targetColumnId)
      if (!destinationColumn) return
      const lastColumnId = getLastColumnId(activeBoard)

      const filteredTasks = destinationColumn.tasks
        .filter((task) => task.id !== taskId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      const previousTask = filteredTasks[targetIndex - 1]
      const nextTask = filteredTasks[targetIndex] ?? null

      let newSortOrder = 1000

      if (previousTask && nextTask) {
        newSortOrder = (previousTask.sortOrder + nextTask.sortOrder) / 2
        if (Math.abs(previousTask.sortOrder - nextTask.sortOrder) < 1) {
          await normalizeColumnOrders(destinationColumn)
          const normalized = destinationColumn.tasks
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .filter((task) => task.id !== taskId)
          const prev = normalized[targetIndex - 1]
          const next = normalized[targetIndex] ?? null
          if (!prev && !next) {
            newSortOrder = 1000
          } else if (!prev && next) {
            newSortOrder = next.sortOrder - 100
          } else if (prev && !next) {
            newSortOrder = prev.sortOrder + 100
          } else if (prev && next) {
            newSortOrder = (prev.sortOrder + next.sortOrder) / 2
          }
        }
      } else if (!previousTask && nextTask) {
        newSortOrder = nextTask.sortOrder - 100
      } else if (previousTask && !nextTask) {
        newSortOrder = previousTask.sortOrder + 100
      }

      const taskSnapshot = activeBoard.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId)
      const nowDate = new Date().toISOString().split('T')[0]
      const updatePayload: Database['public']['Tables']['tasks']['Update'] = {
        board_id: activeBoard.id,
        column_id: targetColumnId,
        sort_order: newSortOrder
      }

      const movingBetweenColumns = sourceColumnId !== targetColumnId

      if (movingBetweenColumns && !taskSnapshot?.startDate) {
        updatePayload.start_date = nowDate
      }

      if (movingBetweenColumns && targetColumnId === lastColumnId && !taskSnapshot?.endDate) {
        updatePayload.due_date = nowDate
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)

      if (error) {
        console.error('Erro ao mover tarefa:', error.message)
        return
      }

      if (sourceColumnId !== targetColumnId) {
        const sourceColumn = activeBoard.columns.find((column) => column.id === sourceColumnId)
        if (sourceColumn) {
          await normalizeColumnOrders(sourceColumn)
        }
      }

      if (taskSnapshot) {
        updateBoardState(activeBoard.id, (board) => {
          const columns = board.columns.map((column) => {
            if (column.id === sourceColumnId && column.id === targetColumnId) {
              const filtered = column.tasks.filter((task) => task.id !== taskId)
              const insertIndex = Math.max(0, Math.min(targetIndex, filtered.length))
              const nextTasks = [...filtered]
              nextTasks.splice(insertIndex, 0, {
                ...taskSnapshot,
                columnId: targetColumnId,
                sortOrder: newSortOrder,
                startDate: updatePayload.start_date ?? taskSnapshot.startDate,
                endDate: updatePayload.due_date ?? taskSnapshot.endDate
              })
              return { ...column, tasks: nextTasks }
            }

            if (column.id === sourceColumnId) {
              return { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) }
            }

            if (column.id === targetColumnId) {
              const filtered = column.tasks.filter((task) => task.id !== taskId)
              const insertIndex = Math.max(0, Math.min(targetIndex, filtered.length))
              const nextTasks = [...filtered]
              nextTasks.splice(insertIndex, 0, {
                ...taskSnapshot,
                columnId: targetColumnId,
                sortOrder: newSortOrder,
                startDate: updatePayload.start_date ?? taskSnapshot.startDate,
                endDate: updatePayload.due_date ?? taskSnapshot.endDate
              })
              return { ...column, tasks: nextTasks }
            }

            return column
          })

          return {
            ...board,
            columns
          }
        })
      }

      void fetchWorkspace({ silent: true })
    },
    [activeBoard, fetchWorkspace, normalizeColumnOrders, updateBoardState]
  )

  const toggleTaskChecklistItem = useCallback(
    async (taskId: string, checklistItemId: string, done: boolean) => {
      if (!activeBoard) return
      const taskSnapshot = activeBoard.columns
        .flatMap((column) => column.tasks)
        .find((task) => task.id === taskId)

      if (!taskSnapshot) return

      const updatedChecklist = taskSnapshot.checklist.map((item) =>
        item.id === checklistItemId ? { ...item, done } : item
      )

      updateBoardState(activeBoard.id, (board) => ({
        ...board,
        columns: board.columns.map((column) => {
          if (column.id !== taskSnapshot.columnId) return column
          return {
            ...column,
            tasks: column.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    checklist: updatedChecklist
                  }
                : task
            )
          }
        })
      }))

      const { error } = await supabase
        .from('tasks')
        .update({ checklist: updatedChecklist as unknown as Json })
        .eq('id', taskId)

      if (error) {
        console.error('Erro ao atualizar checklist da tarefa:', error.message)
        await fetchWorkspace()
        return
      }

      await fetchWorkspace({ silent: true })
    },
    [activeBoard, fetchWorkspace, updateBoardState]
  )

  const createColumn = useCallback(
    async (name: string, category: TaskColumnCategory = 'todo', color?: string) => {
      if (!activeBoard) return
      const slug = slugify(name) || `coluna-${Date.now()}`
      const chosenColor = pickNextColumnColor(activeBoard.columns, color)

      const { error } = await supabase
        .from('task_columns')
        .insert({
          board_id: activeBoard.id,
          name,
          slug,
          category,
          color: chosenColor
        })

      if (error) {
        console.error('Erro ao criar coluna:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [activeBoard, fetchWorkspace]
  )

  const createBoard = useCallback(
    async (name: string, description?: string) => {
      if (!activeProject) return

      const { error } = await supabase
        .from('task_boards')
        .insert({
          project_id: activeProject.id,
          name,
          description: description ?? null
        })

      if (error) {
        console.error('Erro ao criar quadro:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [activeProject, fetchWorkspace]
  )

  const renameBoard = useCallback(
    async (boardId: string, name: string) => {
      const newName = name.trim()
      if (!newName) return
      const { error } = await supabase
        .from('task_boards')
        .update({ name: newName })
        .eq('id', boardId)

      if (error) {
        console.error('Erro ao renomear quadro:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [fetchWorkspace]
  )

  const deleteBoard = useCallback(
    async (boardId: string) => {
      if (!activeProject) return
      const totalBoards = activeProject.boards.length
      if (totalBoards <= 1) {
        console.warn('Não é possível excluir o único quadro do projeto')
        return
      }

      const { error } = await supabase.from('task_boards').delete().eq('id', boardId)

      if (error) {
        console.error('Erro ao excluir quadro:', error.message)
        return
      }

      setActiveBoardId((current) => (current === boardId ? null : current))
      await fetchWorkspace()
    },
    [activeProject, fetchWorkspace]
  )

  const renameColumn = useCallback(
    async (columnId: string, name: string) => {
      const newName = name.trim()
      if (!newName) return
      const { error } = await supabase
        .from('task_columns')
        .update({ name: newName })
        .eq('id', columnId)

      if (error) {
        console.error('Erro ao renomear coluna:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [fetchWorkspace]
  )

  const deleteColumn = useCallback(
    async (columnId: string) => {
      const { error } = await supabase.from('task_columns').delete().eq('id', columnId)

      if (error) {
        console.error('Erro ao excluir coluna:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [fetchWorkspace]
  )

  const updateColumnColor = useCallback(
    async (columnId: string, color: string) => {
      const paletteColor = TASK_COLUMN_COLOR_PALETTE.find((option) => option.toLowerCase() === color.toLowerCase())
      const nextColor = paletteColor ?? TASK_COLUMN_COLOR_PALETTE[0]
      const { error } = await supabase
        .from('task_columns')
        .update({ color: nextColor })
        .eq('id', columnId)

      if (error) {
        console.error('Erro ao atualizar cor da coluna:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [fetchWorkspace]
  )

  const reorderColumns = useCallback(
    async (orderedIds: string[]) => {
      if (!activeBoard || !orderedIds.length) return
      const ordered = orderedIds
        .map((id) => activeBoard.columns.find((column) => column.id === id))
        .filter((column): column is TaskColumn => Boolean(column))

      if (!ordered.length) return

      const updates = ordered.map((column, index) => ({
        id: column.id,
        board_id: activeBoard.id,
        name: column.name,
        slug: column.slug,
        category: column.category,
        color: column.color,
        wip_limit: column.wipLimit ?? null,
        position: (index + 1) * 1000
      }))

      const { error } = await supabase.from('task_columns').upsert(updates)

      if (error) {
        console.error('Erro ao reordenar colunas:', error.message)
        return
      }

      await fetchWorkspace()
    },
    [activeBoard, fetchWorkspace]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) {
        console.error('Erro ao excluir tarefa:', error.message)
      } else {
        await fetchWorkspace()
      }
    },
    [user, fetchWorkspace]
  )

  const value: TasksContextValue = {
    loading,
    projects,
    activeProject,
    activeBoard,
    setActiveProjectId: (projectId: string) => setActiveProjectId(projectId),
    setActiveBoardId: (boardId: string) => setActiveBoardId(boardId),
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskChecklistItem,
    createColumn,
    createBoard,
    renameBoard,
    deleteBoard,
    renameColumn,
    deleteColumn,
    updateColumnColor,
    reorderColumns,
    refresh
  }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
