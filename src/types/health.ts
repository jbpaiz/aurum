// ================================================
// TIPOS TYPESCRIPT - MÓDULO DE SAÚDE
// ================================================

export type ActivityType = 'walking' | 'gym' | 'cycling' | 'swimming' | 'sport' | 'yoga' | 'running' | 'other'
export type ActivityIntensity = 'low' | 'medium' | 'high'
export type SleepQuality = 'poor' | 'normal' | 'good'
export type GoalType = 'weight' | 'activity' | 'sleep'

// ===== WEIGHT LOGS =====
export interface WeightLog {
  id: string
  userId: string
  weight: number // kg
  recordedAt: string // ISO timestamp
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateWeightLogInput {
  weight: number
  recordedAt?: string // opcional, padrão NOW
  note?: string
}

export interface UpdateWeightLogInput {
  weight?: number
  recordedAt?: string
  note?: string
}

// ===== ACTIVITIES =====
export interface Activity {
  id: string
  userId: string
  activityType: ActivityType
  durationMinutes: number
  intensity?: ActivityIntensity | null
  caloriesBurned?: number | null
  activityDate: string // ISO date
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateActivityInput {
  activityType: ActivityType
  durationMinutes: number
  intensity?: ActivityIntensity
  caloriesBurned?: number
  activityDate?: string // opcional, padrão TODAY
  notes?: string
}

export interface UpdateActivityInput {
  activityType?: ActivityType
  durationMinutes?: number
  intensity?: ActivityIntensity
  caloriesBurned?: number
  activityDate?: string
  notes?: string
}

// ===== SLEEP LOGS =====
export interface SleepLog {
  id: string
  userId: string
  sleepDate: string // ISO date (data da noite)
  bedtime: string // ISO timestamp
  wakeTime: string // ISO timestamp
  durationMinutes: number
  quality?: SleepQuality | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSleepLogInput {
  sleepDate?: string // opcional, padrão ontem
  bedtime: string
  wakeTime: string
  quality?: SleepQuality
  notes?: string
}

export interface UpdateSleepLogInput {
  sleepDate?: string
  bedtime?: string
  wakeTime?: string
  quality?: SleepQuality
  notes?: string
}

// ===== GOALS =====
export interface HealthGoal {
  id: string
  userId: string
  goalType: GoalType
  targetValue: number
  targetDate?: string | null // ISO date
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGoalInput {
  goalType: GoalType
  targetValue: number
  targetDate?: string
}

export interface UpdateGoalInput {
  targetValue?: number
  targetDate?: string
  isActive?: boolean
}

// ===== INSIGHTS & STATS =====
export interface WeightStats {
  current: number | null
  min: number | null
  max: number | null
  avg: number | null
  trend: 'up' | 'down' | 'stable' | null
  changeFromStart: number | null
  changeFromYesterday: number | null
  todayCount: number
}

export interface ActivityStats {
  totalDuration: number // minutos
  totalCalories: number
  activitiesCount: number
  weeklyGoal: number // minutos
  weeklyProgress: number // porcentagem
  mostFrequentType: ActivityType | null
}

export interface SleepStats {
  avgDuration: number // minutos
  avgQuality: number // 1-3 (poor=1, normal=2, good=3)
  totalNights: number
  bestNight: number | null
  worstNight: number | null
}

export interface HealthInsight {
  type: 'weight' | 'activity' | 'sleep' | 'general'
  title: string
  description: string
  icon: string
  severity?: 'info' | 'warning' | 'success'
}

// ===== LABELS PARA UI =====
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  walking: 'Caminhada',
  gym: 'Academia',
  cycling: 'Ciclismo',
  swimming: 'Natação',
  sport: 'Esporte',
  yoga: 'Yoga',
  running: 'Corrida',
  other: 'Outro'
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  walking: '🚶',
  gym: '🏋️',
  cycling: '🚴',
  swimming: '🏊',
  sport: '⚽',
  yoga: '🧘',
  running: '🏃',
  other: '💪'
}

export const INTENSITY_LABELS: Record<ActivityIntensity, string> = {
  low: 'Leve',
  medium: 'Moderada',
  high: 'Intensa'
}

export const INTENSITY_COLORS: Record<ActivityIntensity, string> = {
  low: '#10B981', // green
  medium: '#F59E0B', // amber
  high: '#EF4444' // red
}

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  poor: 'Ruim',
  normal: 'Normal',
  good: 'Bom'
}

export const SLEEP_QUALITY_ICONS: Record<SleepQuality, string> = {
  poor: '😴',
  normal: '😐',
  good: '😊'
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  weight: 'Peso',
  activity: 'Atividade',
  sleep: 'Sono'
}
