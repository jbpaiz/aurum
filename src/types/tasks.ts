export type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest'
export type TaskType = 'task' | 'bug' | 'story' | 'epic'
export type TaskColumnCategory = 'backlog' | 'todo' | 'in_progress' | 'waiting' | 'review' | 'done'
export type TaskSprintStatus = 'planned' | 'active' | 'completed'

export interface TaskAttachmentMeta {
  id: string
  name: string
  url: string
  type?: string
}

export interface TaskChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  body: string
  attachments: TaskAttachmentMeta[]
  createdAt: string
  updatedAt: string
}

export interface TaskCard {
  id: string
  key: string
  projectId: string
  boardId: string
  columnId: string
  sprintId?: string | null
  userId: string
  title: string
  description?: string | null
  type: TaskType
  priority: TaskPriority
  reporterId?: string | null
  assigneeId?: string | null
  startDate?: string | null
  endDate?: string | null
  labels: string[]
  attachments: TaskAttachmentMeta[]
  checklist: TaskChecklistItem[]
  isBlocked: boolean
  blockedReason?: string | null
  storyPoints?: number | null
  estimateHours?: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  comments?: TaskComment[]
}

export interface TaskColumn {
  id: string
  boardId: string
  name: string
  slug: string
  category: TaskColumnCategory
  color: string
  wipLimit?: number | null
  position: number
  createdAt: string
  updatedAt: string
  tasks: TaskCard[]
}

export interface TaskSprint {
  id: string
  projectId: string
  boardId: string
  name: string
  goal?: string | null
  status: TaskSprintStatus
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskBoard {
  id: string
  projectId: string
  name: string
  description?: string | null
  viewMode: string
  swimlaneMode: string
  filter: Record<string, unknown>
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  columns: TaskColumn[]
  sprints: TaskSprint[]
}

export interface TaskProject {
  id: string
  userId: string
  name: string
  code: string
  description?: string | null
  color: string
  icon: string
  issueCounter: number
  sortOrder: number
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  boards: TaskBoard[]
}

export interface CreateTaskInput {
  title: string
  description?: string
  columnId?: string
  boardId?: string
  key?: string
  priority?: TaskPriority
  type?: TaskType
  startDate?: string | null
  endDate?: string | null
  labels?: string[]
  attachments?: TaskAttachmentMeta[]
  checklist?: TaskChecklistItem[]
  sprintId?: string | null
  assigneeId?: string | null
  storyPoints?: number | null
  estimateHours?: number | null
  isBlocked?: boolean
  blockedReason?: string | null
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
}

export interface MoveTaskPayload {
  taskId: string
  sourceColumnId: string
  targetColumnId: string
  targetIndex: number
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  lowest: '#94A3B8',
  low: '#0EA5E9',
  medium: '#6366F1',
  high: '#F97316',
  highest: '#DC2626'
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  lowest: 'Muito baixa',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  highest: 'Urgente'
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  task: 'Tarefa',
  bug: 'Bug',
  story: 'História',
  epic: 'Épico'
}

export const TASK_COLUMN_COLOR_PALETTE = [
  '#2563EB',
  '#7C3AED',
  '#F97316',
  '#16A34A',
  '#DB2777',
  '#0EA5E9',
  '#6366F1',
  '#F59E0B',
  '#14B8A6',
  '#475569'
] as const
