export type Theme = 'light' | 'dark' | 'system'
export type HubId = 'finance' | 'tasks'
export type TasksViewMode = 'kanban' | 'list' | 'metrics'

export interface UserPreferences {
  id: string
  userId: string
  theme: Theme
  lastActiveHub: HubId
  tasksViewMode: TasksViewMode
  tasksAdaptiveWidth: boolean
  tasksAdaptiveWidthList: boolean
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
  activeProjectId?: string
  activeBoardId?: string
}
