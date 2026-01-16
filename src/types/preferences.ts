export type Theme = 'light' | 'dark' | 'system'
export type HubId = 'finance' | 'tasks' | 'health'
export type TasksViewMode = 'kanban' | 'list' | 'metrics'
export type TasksSortKey = 'key' | 'title' | 'labels' | 'startDate' | 'endDate' | 'columnName' | 'priority'
export type TasksSortDirection = 'asc' | 'desc'

export interface UserPreferences {
  id: string
  userId: string
  theme: Theme
  lastActiveHub: HubId
  tasksViewMode: TasksViewMode
  tasksAdaptiveWidth: boolean
  tasksAdaptiveWidthList: boolean
  tasksSortKey: TasksSortKey
  tasksSortDirection: TasksSortDirection
  activeProjectId?: string
  activeBoardId?: string
  createdAt: string
  updatedAt: string
}

export interface UserPreferencesInput {
  theme?: Theme
  lastActiveHub?: HubId
  tasksViewMode?: TasksViewMode
  tasksAdaptiveWidth?: boolean
  tasksAdaptiveWidthList?: boolean
  tasksSortKey?: TasksSortKey
  tasksSortDirection?: TasksSortDirection
  activeProjectId?: string
  activeBoardId?: string
}
