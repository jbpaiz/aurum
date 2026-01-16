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

// =====================================================
// NOVOS TIPOS - EXTENSÃO DO MÓDULO
// =====================================================

// ===== MEDIDAS CORPORAIS =====
export interface BodyMeasurement {
  id: string
  userId: string
  measurementDate: string // ISO date
  waist?: number | null // cm
  hips?: number | null
  chest?: number | null
  armLeft?: number | null
  armRight?: number | null
  thighLeft?: number | null
  thighRight?: number | null
  calfLeft?: number | null
  calfRight?: number | null
  neck?: number | null
  bodyFatPercentage?: number | null // %
  muscleMass?: number | null // kg
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBodyMeasurementInput {
  measurementDate?: string
  waist?: number
  hips?: number
  chest?: number
  armLeft?: number
  armRight?: number
  thighLeft?: number
  thighRight?: number
  calfLeft?: number
  calfRight?: number
  neck?: number
  bodyFatPercentage?: number
  muscleMass?: number
  notes?: string
}

export interface UpdateBodyMeasurementInput extends Partial<CreateBodyMeasurementInput> {}

// ===== HIDRATAÇÃO =====
export interface HydrationLog {
  id: string
  userId: string
  logDate: string // ISO date
  amountMl: number
  loggedAt: string // ISO timestamp
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface HydrationGoal {
  id: string
  userId: string
  dailyGoalMl: number
  createdAt: string
  updatedAt: string
}

export interface CreateHydrationLogInput {
  logDate?: string
  amountMl: number
  loggedAt?: string
  notes?: string
}

export interface UpdateHydrationLogInput extends Partial<CreateHydrationLogInput> {}

export interface HydrationStats {
  todayTotal: number
  dailyGoal: number
  progress: number // %
  logsToday: number
  avgDailyLast7Days: number
}

// ===== ALIMENTAÇÃO =====
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  userId: string
  mealDate: string // ISO date
  mealTime: string // HH:mm format
  mealType: MealType
  description: string
  calories?: number | null
  protein?: number | null // g
  carbohydrates?: number | null // g
  fats?: number | null // g
  fiber?: number | null // g
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface NutritionGoal {
  id: string
  userId: string
  dailyCalories?: number | null
  dailyProtein?: number | null // g
  dailyCarbohydrates?: number | null // g
  dailyFats?: number | null // g
  createdAt: string
  updatedAt: string
}

export interface CreateMealInput {
  mealDate?: string
  mealTime?: string
  mealType: MealType
  description: string
  calories?: number
  protein?: number
  carbohydrates?: number
  fats?: number
  fiber?: number
  notes?: string
}

export interface UpdateMealInput extends Partial<CreateMealInput> {}

export interface NutritionStats {
  todayCalories: number
  todayProtein: number
  todayCarbs: number
  todayFats: number
  dailyGoals?: NutritionGoal
  caloriesProgress: number // %
  mealsToday: number
}

// ===== GAMIFICAÇÃO =====
export type BadgeType = 
  | 'first_weight' | 'weight_streak_7' | 'weight_streak_30' | 'weight_goal'
  | 'first_activity' | 'activity_streak_7' | 'activity_streak_30' | 'activity_100h'
  | 'first_sleep' | 'sleep_streak_7' | 'sleep_streak_30' | 'sleep_quality'
  | 'hydration_streak_7' | 'hydration_streak_30'
  | 'meal_logged_100' | 'balanced_week'
  | 'all_in_one_week' | 'health_champion'

export type ChallengeStatus = 'active' | 'completed' | 'failed'

export interface Badge {
  id: string
  userId: string
  badgeType: BadgeType
  earnedAt: string
  createdAt: string
}

export interface UserStats {
  id: string
  userId: string
  totalPoints: number
  level: number
  currentStreak: number
  longestStreak: number
  createdAt: string
  updatedAt: string
}

export interface Challenge {
  id: string
  userId: string
  challengeType: string
  targetValue?: number | null
  currentValue: number
  status: ChallengeStatus
  startDate: string
  endDate: string
  rewardPoints: number
  createdAt: string
  updatedAt: string
}

// ===== LABELS =====
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Café da Manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche'
}

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🍳',
  lunch: '🍽️',
  dinner: '🍲',
  snack: '🍎'
}

export const BADGE_LABELS: Record<BadgeType, string> = {
  first_weight: 'Primeiro Peso',
  weight_streak_7: '7 Dias de Peso',
  weight_streak_30: '30 Dias de Peso',
  weight_goal: 'Meta de Peso Atingida',
  first_activity: 'Primeira Atividade',
  activity_streak_7: '7 Dias Ativo',
  activity_streak_30: '30 Dias Ativo',
  activity_100h: '100 Horas de Atividade',
  first_sleep: 'Primeiro Sono',
  sleep_streak_7: '7 Noites Registradas',
  sleep_streak_30: '30 Noites Registradas',
  sleep_quality: 'Sono de Qualidade',
  hydration_streak_7: '7 Dias Hidratado',
  hydration_streak_30: '30 Dias Hidratado',
  meal_logged_100: '100 Refeições Registradas',
  balanced_week: 'Semana Equilibrada',
  all_in_one_week: 'Tudo em Uma Semana',
  health_champion: 'Campeão da Saúde'
}

export const BADGE_ICONS: Record<BadgeType, string> = {
  first_weight: '🎯',
  weight_streak_7: '📊',
  weight_streak_30: '📈',
  weight_goal: '🏆',
  first_activity: '👟',
  activity_streak_7: '🔥',
  activity_streak_30: '⚡',
  activity_100h: '💯',
  first_sleep: '🌙',
  sleep_streak_7: '😴',
  sleep_streak_30: '💤',
  sleep_quality: '✨',
  hydration_streak_7: '💧',
  hydration_streak_30: '🌊',
  meal_logged_100: '🍽️',
  balanced_week: '⚖️',
  all_in_one_week: '🌟',
  health_champion: '👑'
}
export const MEASUREMENT_LABELS: Record<string, string> = {
  waist: 'Cintura',
  hips: 'Quadril',
  chest: 'Peitoral',
  neck: 'Pescoço',
  armLeft: 'Braço Esquerdo',
  armRight: 'Braço Direito',
  thighLeft: 'Coxa Esquerda',
  thighRight: 'Coxa Direita',
  calfLeft: 'Panturrilha Esquerda',
  calfRight: 'Panturrilha Direita',
  bodyFatPercentage: 'Gordura Corporal',
  muscleMass: 'Massa Muscular'
}