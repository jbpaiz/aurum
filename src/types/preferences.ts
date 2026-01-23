export type Theme = 'light' | 'dark' | 'system'
export type HubId = 'finance' | 'tasks' | 'health' | 'vehicles' | 'flow'
export type TasksViewMode = 'kanban' | 'list' | 'metrics'
export type TasksSortKey = 'key' | 'title' | 'labels' | 'startDate' | 'endDate' | 'columnName' | 'priority'
export type TasksSortDirection = 'asc' | 'desc'

export interface UserPreferences {
  id: string
  userId: string
  theme: Theme
  lastActiveHub: HubId
  enabledHubs: HubId[]
  tasksViewMode: TasksViewMode
  tasksAdaptiveWidth: boolean
  tasksAdaptiveWidthList: boolean
  tasksSortKey: TasksSortKey
  tasksSortDirection: TasksSortDirection
  activeProjectId?: string
  activeBoardId?: string
  showWeight: boolean
  showBody: boolean
  showHydration: boolean
  showNutrition: boolean
  showActivity: boolean
  showSleep: boolean
  showGoals: boolean
  showAchievements: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPreferencesInput {
  theme?: Theme
  lastActiveHub?: HubId
  enabledHubs?: HubId[]
  tasksViewMode?: TasksViewMode
  tasksAdaptiveWidth?: boolean
  tasksAdaptiveWidthList?: boolean
  tasksSortKey?: TasksSortKey
  tasksSortDirection?: TasksSortDirection
  activeProjectId?: string
  activeBoardId?: string
  showWeight?: boolean
  showBody?: boolean
  showHydration?: boolean
  showNutrition?: boolean
  showActivity?: boolean
  showSleep?: boolean
  showGoals?: boolean
  showAchievements?: boolean
}
