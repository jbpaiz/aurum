'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type {
  WeightLog,
  Activity,
  SleepLog,
  HealthGoal,
  BodyMeasurement,
  HydrationLog,
  HydrationGoal,
  Meal,
  NutritionGoal,
  Badge,
  ActivityLevel,
  UserSex,
  UserStats,
  Challenge,
  BadgeType,
  CreateWeightLogInput,
  CreateActivityInput,
  CreateSleepLogInput,
  CreateGoalInput,
  CreateBodyMeasurementInput,
  CreateHydrationLogInput,
  CreateHydrationGoalInput,
  CreateMealInput,
  UpdateWeightLogInput,
  UpdateActivityInput,
  UpdateSleepLogInput,
  UpdateGoalInput,
  UpdateBodyMeasurementInput,
  UpdateHydrationLogInput,
  UpdateHydrationGoalInput,
  UpdateMealInput,
  WeightStats,
  ActivityStats,
  SleepStats,
  HydrationStats,
  NutritionStats,
  HealthInsight
} from '@/types/health'
import { differenceInMinutes, format, startOfDay, startOfWeek, subDays } from 'date-fns'

interface HealthContextValue {
  // Estado
  loading: boolean
  weightLogs: WeightLog[]
  activities: Activity[]
  sleepLogs: SleepLog[]
  goals: HealthGoal[]
  bodyMeasurements: BodyMeasurement[]
  hydrationLogs: HydrationLog[]
  hydrationGoal: HydrationGoal | null
  meals: Meal[]
  nutritionGoal: NutritionGoal | null
  badges: Badge[]
  userStats: UserStats | null
  challenges: Challenge[]

  // Perfil
  updateUserStatsProfile: (input: { heightCm?: number | null; birthDate?: string | null; sex?: UserSex | null; activityLevel?: ActivityLevel | null; bodyFatPercentage?: number | null }) => Promise<void>
  
  // Stats
  weightStats: WeightStats | null
  activityStats: ActivityStats | null
  sleepStats: SleepStats | null
  hydrationStats: HydrationStats | null
  nutritionStats: NutritionStats | null
  insights: HealthInsight[]
  
  // Weight
  createWeightLog: (input: CreateWeightLogInput) => Promise<void>
  updateWeightLog: (id: string, input: UpdateWeightLogInput) => Promise<void>
  deleteWeightLog: (id: string) => Promise<void>
  
  // Activity
  createActivity: (input: CreateActivityInput) => Promise<void>
  updateActivity: (id: string, input: UpdateActivityInput) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  
  // Sleep
  createSleepLog: (input: CreateSleepLogInput) => Promise<void>
  updateSleepLog: (id: string, input: UpdateSleepLogInput) => Promise<void>
  deleteSleepLog: (id: string) => Promise<void>
  
  // Goals
  createGoal: (input: CreateGoalInput) => Promise<void>
  updateGoal: (id: string, input: UpdateGoalInput) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  
  // Body Measurements
  createBodyMeasurement: (input: CreateBodyMeasurementInput) => Promise<void>
  updateBodyMeasurement: (id: string, input: UpdateBodyMeasurementInput) => Promise<void>
  deleteBodyMeasurement: (id: string) => Promise<void>
  
  // Hydration
  createHydrationLog: (input: CreateHydrationLogInput) => Promise<void>
  updateHydrationLog: (id: string, input: UpdateHydrationLogInput) => Promise<void>
  deleteHydrationLog: (id: string) => Promise<void>
  createOrUpdateHydrationGoal: (input: CreateHydrationGoalInput) => Promise<void>
  
  // Nutrition
  createMeal: (input: CreateMealInput) => Promise<void>
  updateMeal: (id: string, input: UpdateMealInput) => Promise<void>
  deleteMeal: (id: string) => Promise<void>
  createOrUpdateNutritionGoal: (goal: Partial<NutritionGoal>) => Promise<void>
  
  // Gamification
  checkAndAwardBadges: () => Promise<void>
  
  // Refresh
  refresh: () => Promise<void>
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined)

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([])
  const [goals, setGoals] = useState<HealthGoal[]>([])
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([])
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([])
  const [hydrationGoal, setHydrationGoal] = useState<HydrationGoal | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  
  // Carregar dados
  const loadData = useCallback(async () => {
    if (!user) {
      setWeightLogs([])
      setActivities([])
      setSleepLogs([])
      setGoals([])
      setBodyMeasurements([])
      setHydrationLogs([])
      setHydrationGoal(null)
      setMeals([])
      setNutritionGoal(null)
      setBadges([])
      setUserStats(null)
      setChallenges([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Buscar histórico completo
      
      const [weightRes, activitiesRes, sleepRes, goalsRes, measurementsRes, hydrationRes, hydrationGoalRes, mealsRes, nutritionGoalRes, badgesRes, userStatsRes, challengesRes] = await Promise.all([
        supabase
          .from('health_weight_logs')
          .select('*')
          .order('recorded_at', { ascending: false }),
        
        supabase
          .from('health_activities')
          .select('*')
          .gte('activity_date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
          .order('activity_date', { ascending: false }),
        
        supabase
          .from('health_sleep_logs')
          .select('*')
          .gte('sleep_date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
          .order('sleep_date', { ascending: false }),
        
        supabase
          .from('health_goals')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('health_body_measurements')
          .select('*')
          .gte('measurement_date', format(subDays(new Date(), 365), 'yyyy-MM-dd'))
          .order('measurement_date', { ascending: false }),
        
        supabase
          .from('health_hydration')
          .select('*')
          .gte('log_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('logged_at', { ascending: false }),
        
        supabase
          .from('health_hydration_goals')
          .select('*')
          .maybeSingle(),
        
        supabase
          .from('health_meals')
          .select('*')
          .gte('meal_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('meal_date', { ascending: false })
          .order('meal_time', { ascending: false }),
        
        supabase
          .from('health_nutrition_goals')
          .select('*')
          .maybeSingle(),
        
        supabase
          .from('health_badges')
          .select('*')
          .order('earned_at', { ascending: false }),
        
        supabase
          .from('health_user_stats')
          .select('*')
          .maybeSingle(),
        
        supabase
          .from('health_challenges')
          .select('*')
          .in('status', ['active', 'completed'])
          .order('created_at', { ascending: false })
      ])

      if (weightRes.data) {
        setWeightLogs(weightRes.data.map(mapWeightLog))
      }
      
      if (activitiesRes.data) {
        setActivities(activitiesRes.data.map(mapActivity))
      }
      
      if (sleepRes.data) {
        setSleepLogs(sleepRes.data.map(mapSleepLog))
      }
      
      if (goalsRes.data) {
        setGoals(goalsRes.data.map(mapGoal))
      }
      
      if (measurementsRes.data) {
        setBodyMeasurements(measurementsRes.data.map(mapBodyMeasurement))
      }
      
      if (hydrationRes.data) {
        setHydrationLogs(hydrationRes.data.map(mapHydrationLog))
      }
      
      if (hydrationGoalRes.data) {
        setHydrationGoal(mapHydrationGoal(hydrationGoalRes.data))
      }
      
      if (mealsRes.data) {
        setMeals(mealsRes.data.map(mapMeal))
      }
      
      if (nutritionGoalRes.data) {
        setNutritionGoal(mapNutritionGoal(nutritionGoalRes.data))
      }
      
      if (badgesRes.data) {
        setBadges(badgesRes.data.map(mapBadge))
      }
      
      if (userStatsRes.data) {
        setUserStats(mapUserStats(userStatsRes.data))
      }
      
      if (challengesRes.data) {
        setChallenges(challengesRes.data.map(mapChallenge))
      }
    } catch (error) {
      console.error('Erro ao carregar dados de saúde:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ===== WEIGHT LOGS =====
  const createWeightLog = useCallback(async (input: CreateWeightLogInput) => {
    if (!user) return

    const { data, error } = await supabase
      .from('health_weight_logs')
      .insert({
        user_id: user.id,
        weight: input.weight,
        recorded_at: input.recordedAt || new Date().toISOString(),
        note: input.note || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setWeightLogs(prev => [mapWeightLog(data), ...prev])
    }
  }, [user])

  const updateWeightLog = useCallback(async (id: string, input: UpdateWeightLogInput) => {
    const { error } = await supabase
      .from('health_weight_logs')
      .update({
        weight: input.weight,
        recorded_at: input.recordedAt,
        note: input.note
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteWeightLog = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_weight_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
    setWeightLogs(prev => prev.filter(log => log.id !== id))
  }, [])

  // ===== ACTIVITIES =====
  const createActivity = useCallback(async (input: CreateActivityInput) => {
    if (!user) return

    const { data, error } = await supabase
      .from('health_activities')
      .insert({
        user_id: user.id,
        activity_type: input.activityType,
        duration_minutes: input.durationMinutes,
        distance_km: input.distanceKm || null,
        intensity: input.intensity || null,
        calories_burned: input.caloriesBurned || null,
        activity_date: input.activityDate || format(new Date(), 'yyyy-MM-dd'),
        notes: input.notes || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setActivities(prev => [mapActivity(data), ...prev])
    }
  }, [user])

  const updateActivity = useCallback(async (id: string, input: UpdateActivityInput) => {
    const { error } = await supabase
      .from('health_activities')
      .update({
        activity_type: input.activityType,
        duration_minutes: input.durationMinutes,
        distance_km: input.distanceKm ?? null,
        intensity: input.intensity,
        calories_burned: input.caloriesBurned,
        activity_date: input.activityDate,
        notes: input.notes
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteActivity = useCallback(async (id: string) => {
    const { error} = await supabase
      .from('health_activities')
      .delete()
      .eq('id', id)

    if (error) throw error
    setActivities(prev => prev.filter(act => act.id !== id))
  }, [])

  // ===== SLEEP LOGS =====
  const createSleepLog = useCallback(async (input: CreateSleepLogInput) => {
    if (!user) throw new Error('Usuário não autenticado')

    const bedtime = new Date(input.bedtime)
    const wakeTime = new Date(input.wakeTime)
    let durationMinutes = differenceInMinutes(wakeTime, bedtime)
    if (durationMinutes <= 0) {
      durationMinutes += 24 * 60
    }

    const { data, error } = await supabase
      .from('health_sleep_logs')
      .insert({
        user_id: user.id,
        sleep_date: input.sleepDate || format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        bedtime: input.bedtime,
        wake_time: input.wakeTime,
        duration_minutes: durationMinutes,
        quality: input.quality || null,
        notes: input.notes || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setSleepLogs(prev => [mapSleepLog(data), ...prev])
    }
  }, [user])

  const updateSleepLog = useCallback(async (id: string, input: UpdateSleepLogInput) => {
    let durationMinutes: number | undefined
    if (input.bedtime && input.wakeTime) {
      durationMinutes = differenceInMinutes(new Date(input.wakeTime), new Date(input.bedtime))
      if (durationMinutes <= 0) {
        durationMinutes += 24 * 60
      }
    }

    const { error } = await supabase
      .from('health_sleep_logs')
      .update({
        sleep_date: input.sleepDate,
        bedtime: input.bedtime,
        wake_time: input.wakeTime,
        duration_minutes: durationMinutes,
        quality: input.quality,
        notes: input.notes
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteSleepLog = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_sleep_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
    setSleepLogs(prev => prev.filter(log => log.id !== id))
  }, [])

  // ===== GOALS =====
  const createGoal = useCallback(async (input: CreateGoalInput) => {
    if (!user) return

    const { data, error } = await supabase
      .from('health_goals')
      .insert({
        user_id: user.id,
        goal_type: input.goalType,
        target_value: input.targetValue,
        target_date: input.targetDate || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setGoals(prev => [mapGoal(data), ...prev])
    }
  }, [user])

  const updateGoal = useCallback(async (id: string, input: UpdateGoalInput) => {
    const { error } = await supabase
      .from('health_goals')
      .update({
        target_value: input.targetValue,
        target_date: input.targetDate,
        is_active: input.isActive
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteGoal = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_goals')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    setGoals(prev => prev.filter(goal => goal.id !== id))
  }, [])

  // ===== BODY MEASUREMENTS =====
  const createBodyMeasurement = useCallback(async (input: CreateBodyMeasurementInput) => {
    if (!user) return

    const { data, error } = await supabase
      .from('health_body_measurements')
      .insert({
        user_id: user.id,
        measurement_date: input.measurementDate || format(new Date(), 'yyyy-MM-dd'),
        waist: input.waist || null,
        hips: input.hips || null,
        chest: input.chest || null,
        arm_left: input.armLeft || null,
        arm_right: input.armRight || null,
        thigh_left: input.thighLeft || null,
        thigh_right: input.thighRight || null,
        calf_left: input.calfLeft || null,
        calf_right: input.calfRight || null,
        neck: input.neck || null,
        body_fat_percentage: input.bodyFatPercentage || null,
        muscle_mass: input.muscleMass || null,
        notes: input.notes || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setBodyMeasurements(prev => [mapBodyMeasurement(data), ...prev])
    }
  }, [user])

  const updateBodyMeasurement = useCallback(async (id: string, input: UpdateBodyMeasurementInput) => {
    const { error } = await supabase
      .from('health_body_measurements')
      .update({
        measurement_date: input.measurementDate,
        waist: input.waist,
        hips: input.hips,
        chest: input.chest,
        arm_left: input.armLeft,
        arm_right: input.armRight,
        thigh_left: input.thighLeft,
        thigh_right: input.thighRight,
        calf_left: input.calfLeft,
        calf_right: input.calfRight,
        neck: input.neck,
        body_fat_percentage: input.bodyFatPercentage,
        muscle_mass: input.muscleMass,
        notes: input.notes
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteBodyMeasurement = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_body_measurements')
      .delete()
      .eq('id', id)

    if (error) throw error
    setBodyMeasurements(prev => prev.filter(m => m.id !== id))
  }, [])

  // ===== HYDRATION =====
  const createHydrationLog = useCallback(async (input: CreateHydrationLogInput) => {
    if (!user) return

    const { data, error } = await supabase
      .from('health_hydration')
      .insert({
        user_id: user.id,
        log_date: input.logDate || format(new Date(), 'yyyy-MM-dd'),
        amount_ml: input.amountMl,
        logged_at: input.loggedAt || new Date().toISOString(),
        notes: input.notes || null
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      setHydrationLogs(prev => [mapHydrationLog(data), ...prev])
    }
  }, [user])

  const updateHydrationLog = useCallback(async (id: string, input: UpdateHydrationLogInput) => {
    const { error } = await supabase
      .from('health_hydration')
      .update({
        log_date: input.logDate,
        amount_ml: input.amountMl,
        logged_at: input.loggedAt,
        notes: input.notes
      })
      .eq('id', id)

    if (error) throw error
    await loadData()
  }, [loadData])

  const deleteHydrationLog = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_hydration')
      .delete()
      .eq('id', id)

    if (error) throw error
    setHydrationLogs(prev => prev.filter(log => log.id !== id))
  }, [])

  const createOrUpdateHydrationGoal = useCallback(async (input: CreateHydrationGoalInput) => {
    if (!user) return

    // Try to update first
    const { data: existing } = await supabase
      .from('health_hydration_goals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('health_hydration_goals')
        .update({ daily_goal_ml: input.dailyGoalMl })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('health_hydration_goals')
        .insert({
          user_id: user.id,
          daily_goal_ml: input.dailyGoalMl
        })

      if (error) throw error
    }

    await loadData()
  }, [user, loadData])

  // ===== NUTRITION =====
  const createMeal = useCallback(async (input: CreateMealInput) => {
    if (!user) return
    
    const mealDate = input.mealDate || format(new Date(), 'yyyy-MM-dd')
    const mealTime = input.mealTime || format(new Date(), 'HH:mm')
    
    const { error } = await supabase
      .from('health_meals')
      .insert({
        user_id: user.id,
        meal_date: mealDate,
        meal_time: mealTime,
        meal_type: input.mealType,
        description: input.description,
        calories: input.calories || null,
        protein: input.protein || null,
        carbohydrates: input.carbohydrates || null,
        fats: input.fats || null,
        fiber: input.fiber || null,
        notes: input.notes || null
      })

    if (error) throw error

    await loadData()
  }, [user, loadData])

  const updateMeal = useCallback(async (id: string, input: UpdateMealInput) => {
    const updateData: any = {}
    
    if (input.mealDate !== undefined) updateData.meal_date = input.mealDate
    if (input.mealTime !== undefined) updateData.meal_time = input.mealTime
    if (input.mealType !== undefined) updateData.meal_type = input.mealType
    if (input.description !== undefined) updateData.description = input.description
    if (input.calories !== undefined) updateData.calories = input.calories
    if (input.protein !== undefined) updateData.protein = input.protein
    if (input.carbohydrates !== undefined) updateData.carbohydrates = input.carbohydrates
    if (input.fats !== undefined) updateData.fats = input.fats
    if (input.fiber !== undefined) updateData.fiber = input.fiber
    if (input.notes !== undefined) updateData.notes = input.notes

    const { error } = await supabase
      .from('health_meals')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    await loadData()
  }, [loadData])

  const deleteMeal = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('health_meals')
      .delete()
      .eq('id', id)

    if (error) throw error

    setMeals(prev => prev.filter(m => m.id !== id))
  }, [])

  const createOrUpdateNutritionGoal = useCallback(async (goal: Partial<NutritionGoal>) => {
    if (!user) return

    // Verificar se já existe uma meta
    const { data: existing } = await supabase
      .from('health_nutrition_goals')
      .select('id')
      .single()

    if (existing) {
      const updateData: any = {}
      if (goal.dailyCalories !== undefined) updateData.daily_calories = goal.dailyCalories
      if (goal.dailyProtein !== undefined) updateData.daily_protein = goal.dailyProtein
      if (goal.dailyCarbohydrates !== undefined) updateData.daily_carbohydrates = goal.dailyCarbohydrates
      if (goal.dailyFats !== undefined) updateData.daily_fats = goal.dailyFats

      const { error } = await supabase
        .from('health_nutrition_goals')
        .update(updateData)
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('health_nutrition_goals')
        .insert({
          user_id: user.id,
          daily_calories: goal.dailyCalories || null,
          daily_protein: goal.dailyProtein || null,
          daily_carbohydrates: goal.dailyCarbohydrates || null,
          daily_fats: goal.dailyFats || null
        })

      if (error) throw error
    }

    await loadData()
  }, [user, loadData])

  // ===== GAMIFICATION =====
  const checkAndAwardBadges = useCallback(async () => {
    if (!user) return

    // Verificar conquistas baseadas nos dados atuais
    const potentialBadges: BadgeType[] = []

    // Primeiro peso
    if (weightLogs.length === 1) potentialBadges.push('first_weight')
    
    // Streak de peso (7 e 30 dias)
    const recentWeightDays = new Set(weightLogs.slice(0, 7).map(w => format(new Date(w.recordedAt), 'yyyy-MM-dd')))
    if (recentWeightDays.size >= 7) potentialBadges.push('weight_streak_7')
    
    const monthWeightDays = new Set(weightLogs.slice(0, 30).map(w => format(new Date(w.recordedAt), 'yyyy-MM-dd')))
    if (monthWeightDays.size >= 30) potentialBadges.push('weight_streak_30')

    // Primeira atividade
    if (activities.length === 1) potentialBadges.push('first_activity')
    
    // Streak de atividades
    const recentActivityDays = new Set(activities.slice(0, 7).map(a => a.activityDate))
    if (recentActivityDays.size >= 7) potentialBadges.push('activity_streak_7')
    
    const monthActivityDays = new Set(activities.slice(0, 30).map(a => a.activityDate))
    if (monthActivityDays.size >= 30) potentialBadges.push('activity_streak_30')

    // 100 horas de atividade
    const totalActivityHours = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0) / 60
    if (totalActivityHours >= 100) potentialBadges.push('activity_100h')

    // Primeiro sono
    if (sleepLogs.length === 1) potentialBadges.push('first_sleep')
    
    // Streak de sono
    const recentSleepDays = new Set(sleepLogs.slice(0, 7).map(s => s.sleepDate))
    if (recentSleepDays.size >= 7) potentialBadges.push('sleep_streak_7')
    
    const monthSleepDays = new Set(sleepLogs.slice(0, 30).map(s => s.sleepDate))
    if (monthSleepDays.size >= 30) potentialBadges.push('sleep_streak_30')

    // Hidratação streak
    const recentHydrationDays = new Set(hydrationLogs.slice(0, 7).map(h => h.logDate))
    if (recentHydrationDays.size >= 7) potentialBadges.push('hydration_streak_7')
    
    const monthHydrationDays = new Set(hydrationLogs.slice(0, 30).map(h => h.logDate))
    if (monthHydrationDays.size >= 30) potentialBadges.push('hydration_streak_30')

    // 100 refeições registradas
    if (meals.length >= 100) potentialBadges.push('meal_logged_100')

    // Verificar quais badges ainda não foram conquistadas
    const existingBadgeTypes = badges.map(b => b.badgeType)
    const newBadges = potentialBadges.filter(type => !existingBadgeTypes.includes(type))

    // Inserir novas badges
    if (newBadges.length > 0) {
      const { error } = await supabase
        .from('health_badges')
        .insert(newBadges.map(badgeType => ({
          user_id: user.id,
          badge_type: badgeType,
          earned_at: new Date().toISOString()
        })))

      if (error) console.error('Erro ao criar badges:', error)

      // Atualizar pontos do usuário
      const pointsToAdd = newBadges.length * 100
      if (userStats) {
        const newTotalPoints = userStats.totalPoints + pointsToAdd
        const newLevel = Math.floor(newTotalPoints / 1000) + 1

        await supabase
          .from('health_user_stats')
          .update({
            total_points: newTotalPoints,
            level: newLevel
          })
          .eq('user_id', user.id)
      } else {
        // Criar stats se não existir
        await supabase
          .from('health_user_stats')
          .insert({
            user_id: user.id,
            total_points: newBadges.length * 100,
            level: 1,
            current_streak: 0,
            longest_streak: 0
          })
      }

      await loadData()
    }
  }, [user, weightLogs, activities, sleepLogs, hydrationLogs, meals, badges, userStats, loadData])

  // ===== USER PROFILE (altura/idade) =====
  const updateUserStatsProfile = useCallback(
    async (input: { heightCm?: number | null; birthDate?: string | null; sex?: UserSex | null; activityLevel?: ActivityLevel | null; bodyFatPercentage?: number | null }) => {
      if (!user) return
      const payload = {
        user_id: user.id,
        height_cm: input.heightCm ?? null,
        birth_date: input.birthDate ?? null,
        sex: input.sex ?? null,
        activity_level: input.activityLevel ?? null,
        body_fat_percentage: input.bodyFatPercentage ?? null
      }
      const { data, error } = await supabase
        .from('health_user_stats')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setUserStats(mapUserStats(data))
      }
    },
    [user]
  )

  useEffect(() => {
    if (!user || loading) return
    checkAndAwardBadges().catch((error) => {
      console.error('Erro ao verificar conquistas:', error)
    })
  }, [checkAndAwardBadges, user, loading, weightLogs, activities, sleepLogs, hydrationLogs, meals])

  // ===== STATS =====
  const weightStats: WeightStats | null = calculateWeightStats(weightLogs, goals)
  const activityStats: ActivityStats | null = calculateActivityStats(activities, goals)
  const sleepStats: SleepStats | null = calculateSleepStats(sleepLogs)
  const hydrationStats: HydrationStats | null = calculateHydrationStats(hydrationLogs, hydrationGoal)
  const nutritionStats: NutritionStats | null = calculateNutritionStats(meals, nutritionGoal)
  const insights: HealthInsight[] = generateInsights(weightStats, activityStats, sleepStats, goals)

  const value: HealthContextValue = {
    loading,
    weightLogs,
    activities,
    sleepLogs,
    goals,
    bodyMeasurements,
    hydrationLogs,
    hydrationGoal,
    meals,
    nutritionGoal,
    badges,
    userStats,
    challenges,
    updateUserStatsProfile,
    weightStats,
    activityStats,
    sleepStats,
    hydrationStats,
    nutritionStats,
    insights,
    createWeightLog,
    updateWeightLog,
    deleteWeightLog,
    createActivity,
    updateActivity,
    deleteActivity,
    createSleepLog,
    updateSleepLog,
    deleteSleepLog,
    createGoal,
    updateGoal,
    deleteGoal,
    createBodyMeasurement,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    createHydrationLog,
    updateHydrationLog,
    deleteHydrationLog,
    createOrUpdateHydrationGoal,
    createMeal,
    updateMeal,
    deleteMeal,
    createOrUpdateNutritionGoal,
    checkAndAwardBadges,
    refresh: loadData
  }

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}

export function useHealth() {
  const context = useContext(HealthContext)
  if (!context) {
    throw new Error('useHealth must be used within HealthProvider')
  }
  return context
}

// ===== MAPPERS =====
function mapWeightLog(data: any): WeightLog {
  return {
    id: data.id,
    userId: data.user_id,
    weight: Number(data.weight),
    recordedAt: data.recorded_at,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapActivity(data: any): Activity {
  return {
    id: data.id,
    userId: data.user_id,
    activityType: data.activity_type,
    durationMinutes: data.duration_minutes,
    distanceKm: data.distance_km ? Number(data.distance_km) : null,
    intensity: data.intensity,
    caloriesBurned: data.calories_burned,
    activityDate: data.activity_date,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapSleepLog(data: any): SleepLog {
  return {
    id: data.id,
    userId: data.user_id,
    sleepDate: data.sleep_date,
    bedtime: data.bedtime,
    wakeTime: data.wake_time,
    durationMinutes: data.duration_minutes,
    quality: data.quality,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapGoal(data: any): HealthGoal {
  return {
    id: data.id,
    userId: data.user_id,
    goalType: data.goal_type,
    targetValue: Number(data.target_value),
    targetDate: data.target_date,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapBodyMeasurement(data: any): BodyMeasurement {
  return {
    id: data.id,
    userId: data.user_id,
    measurementDate: data.measurement_date,
    waist: data.waist ? Number(data.waist) : null,
    hips: data.hips ? Number(data.hips) : null,
    chest: data.chest ? Number(data.chest) : null,
    armLeft: data.arm_left ? Number(data.arm_left) : null,
    armRight: data.arm_right ? Number(data.arm_right) : null,
    thighLeft: data.thigh_left ? Number(data.thigh_left) : null,
    thighRight: data.thigh_right ? Number(data.thigh_right) : null,
    calfLeft: data.calf_left ? Number(data.calf_left) : null,
    calfRight: data.calf_right ? Number(data.calf_right) : null,
    neck: data.neck ? Number(data.neck) : null,
    bodyFatPercentage: data.body_fat_percentage ? Number(data.body_fat_percentage) : null,
    muscleMass: data.muscle_mass ? Number(data.muscle_mass) : null,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapHydrationLog(data: any): HydrationLog {
  return {
    id: data.id,
    userId: data.user_id,
    logDate: data.log_date,
    amountMl: data.amount_ml,
    loggedAt: data.logged_at,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapHydrationGoal(data: any): HydrationGoal {
  return {
    id: data.id,
    userId: data.user_id,
    dailyGoalMl: data.daily_goal_ml,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapMeal(data: any): Meal {
  return {
    id: data.id,
    userId: data.user_id,
    mealDate: data.meal_date,
    mealTime: data.meal_time,
    mealType: data.meal_type,
    description: data.description,
    calories: data.calories,
    protein: data.protein,
    carbohydrates: data.carbohydrates,
    fats: data.fats,
    fiber: data.fiber,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapNutritionGoal(data: any): NutritionGoal {
  return {
    id: data.id,
    userId: data.user_id,
    dailyCalories: data.daily_calories,
    dailyProtein: data.daily_protein,
    dailyCarbohydrates: data.daily_carbohydrates,
    dailyFats: data.daily_fats,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapBadge(data: any): Badge {
  return {
    id: data.id,
    userId: data.user_id,
    badgeType: data.badge_type,
    earnedAt: data.earned_at,
    createdAt: data.created_at
  }
}

function mapUserStats(data: any): UserStats {
  return {
    id: data.id,
    userId: data.user_id,
    totalPoints: data.total_points,
    level: data.level,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    heightCm: data.height_cm ?? null,
    birthDate: data.birth_date ?? null,
    sex: data.sex ?? null,
    activityLevel: data.activity_level ?? null,
    bodyFatPercentage: data.body_fat_percentage ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

function mapChallenge(data: any): Challenge {
  return {
    id: data.id,
    userId: data.user_id,
    challengeType: data.challenge_type,
    targetValue: data.target_value,
    currentValue: data.current_value,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    rewardPoints: data.reward_points,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

// ===== CALCULATORS =====
function calculateWeightStats(logs: WeightLog[], goals: HealthGoal[]): WeightStats | null {
  if (logs.length === 0) return null

  const today = startOfDay(new Date())
  const todayLogs = logs.filter(log => startOfDay(new Date(log.recordedAt)).getTime() === today.getTime())
  const yesterday = startOfDay(subDays(new Date(), 1))
  const yesterdayLogs = logs.filter(log => startOfDay(new Date(log.recordedAt)).getTime() === yesterday.getTime())
  
  const weights = logs.map(l => l.weight)
  const current = todayLogs.length > 0 ? todayLogs[0].weight : logs[0].weight
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length

  const changeFromYesterday = yesterdayLogs.length > 0 
    ? current - yesterdayLogs[yesterdayLogs.length - 1].weight 
    : null

  const sevenDaysAgo = logs.filter(log => new Date(log.recordedAt) >= subDays(new Date(), 7))
  const trend = sevenDaysAgo.length >= 3
    ? sevenDaysAgo[0].weight > sevenDaysAgo[sevenDaysAgo.length - 1].weight ? 'up' : 
      sevenDaysAgo[0].weight < sevenDaysAgo[sevenDaysAgo.length - 1].weight ? 'down' : 'stable'
    : null

  // Weekly / monthly change
  const latestDate = new Date(logs[0].recordedAt)
  const weekCutoff = subDays(latestDate, 7)
  const monthCutoff = subDays(latestDate, 30)
  const lastWeekLog = logs.find(l => new Date(l.recordedAt) <= weekCutoff)
  const lastMonthLog = logs.find(l => new Date(l.recordedAt) <= monthCutoff)
  const weeklyChange = lastWeekLog ? current - lastWeekLog.weight : null
  const monthlyChange = lastMonthLog ? current - lastMonthLog.weight : null

  // Trend regression (kg/week)
  const ascLogs = [...logs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  const n = ascLogs.length
  const xs = ascLogs.map((l, idx) => idx) // simple index for spacing
  const ys = ascLogs.map(l => l.weight)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0)
  const denom = n * sumXX - sumX * sumX
  const slopePerSample = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
  const trendKgPerWeek = slopePerSample * 7 // samples assumed roughly daily order

  // Goal context
  const weightGoal = goals.find(g => g.goalType === 'weight' && g.isActive)
  const goalTarget = weightGoal?.targetValue ?? null
  const goalDate = weightGoal?.targetDate || null
  let goalProgress: number | null = null
  if (goalTarget !== null) {
    const baseline = ascLogs[0].weight
    const deltaTotal = goalTarget - baseline
    const deltaCurrent = goalTarget - current
    goalProgress = deltaTotal !== 0 ? 1 - (deltaCurrent / deltaTotal) : null
    if (goalProgress !== null) {
      goalProgress = Math.min(1, Math.max(0, goalProgress))
    }
  }

  let goalExpectedToday: number | null = null
  let goalExpectedTomorrow: number | null = null
  let goalDeltaFromExpected: number | null = null
  if (goalTarget !== null && goalDate) {
    const startWeight = ascLogs[0].weight
    const startTime = new Date(ascLogs[0].recordedAt).getTime()
    const goalTime = new Date(goalDate).getTime()
    const nowTime = Date.now()
    const span = goalTime - startTime
    if (span !== 0) {
      const clampedNow = Math.min(Math.max(nowTime, startTime), goalTime)
      const progressTime = clampedNow - startTime
      goalExpectedToday = startWeight + (goalTarget - startWeight) * (progressTime / span)

      // Calcular expectativa para amanhã (clamped entre início e meta)
      const tomorrowMillis = 24 * 60 * 60 * 1000
      const clampedTomorrow = Math.min(Math.max(nowTime + tomorrowMillis, startTime), goalTime)
      const progressTomorrow = clampedTomorrow - startTime
      goalExpectedTomorrow = startWeight + (goalTarget - startWeight) * (progressTomorrow / span)

      goalDeltaFromExpected = current - goalExpectedToday
    }
  }

  let etaWeeksToGoal: number | null = null
  if (goalTarget !== null && trendKgPerWeek !== 0) {
    const remaining = goalTarget - current
    if ((remaining > 0 && trendKgPerWeek > 0) || (remaining < 0 && trendKgPerWeek < 0)) {
      etaWeeksToGoal = Math.abs(remaining / trendKgPerWeek)
    }
  }

  // Best / worst week (net change per week window)
  const weeklyBuckets: Record<string, { first: number; last: number }> = {}
  ascLogs.forEach(log => {
    const weekKey = startOfWeek(new Date(log.recordedAt)).toISOString()
    if (!weeklyBuckets[weekKey]) {
      weeklyBuckets[weekKey] = { first: log.weight, last: log.weight }
    } else {
      weeklyBuckets[weekKey].last = log.weight
    }
  })
  const weekChanges = Object.values(weeklyBuckets).map(w => w.last - w.first)
  const bestWeekChange = weekChanges.length > 0 ? Math.min(...weekChanges) : null // most loss
  const worstWeekChange = weekChanges.length > 0 ? Math.max(...weekChanges) : null // most gain

  return {
    current,
    min,
    max,
    avg,
    trend,
    changeFromStart: current - weights[weights.length - 1],
    changeFromYesterday,
    todayCount: todayLogs.length,
    weeklyChange,
    monthlyChange,
    trendKgPerWeek,
    etaWeeksToGoal,
    goalTarget,
    goalDate,
    goalProgress,
    goalExpectedToday,
    goalExpectedTomorrow,
    goalDeltaFromExpected,
    bestWeekChange,
    worstWeekChange
  }
}

function calculateActivityStats(activities: Activity[], goals: HealthGoal[]): ActivityStats | null {
  const sevenDaysAgo = subDays(new Date(), 7)
  const weekActivities = activities.filter(a => new Date(a.activityDate) >= sevenDaysAgo)
  
  const totalDuration = weekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
  const totalCalories = weekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)
  const totalDistanceKm = weekActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0)
  
  const activityGoal = goals.find(g => g.goalType === 'activity')
  const weeklyGoal = activityGoal?.targetValue || 150 // WHO recommendation
  const weeklyProgress = (totalDuration / weeklyGoal) * 100

  const typeCounts = weekActivities.reduce((acc, a) => {
    acc[a.activityType] = (acc[a.activityType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const mostFrequentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as any

  return {
    totalDuration,
    totalCalories,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    activitiesCount: weekActivities.length,
    weeklyGoal,
    weeklyProgress: Math.min(weeklyProgress, 100),
    mostFrequentType
  }
}

function calculateSleepStats(logs: SleepLog[]): SleepStats | null {
  const sevenDaysAgo = subDays(new Date(), 7)
  const weekLogs = logs.filter(l => new Date(l.sleepDate) >= sevenDaysAgo)
  
  if (weekLogs.length === 0) return null

  const durations = weekLogs.map(l => l.durationMinutes)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  
  const qualityValues = weekLogs
    .filter(l => l.quality)
    .map(l => l.quality === 'poor' ? 1 : l.quality === 'normal' ? 2 : 3)
  
  const avgQuality = qualityValues.length > 0
    ? qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length
    : 2

  return {
    avgDuration,
    avgQuality,
    totalNights: weekLogs.length,
    bestNight: Math.max(...durations),
    worstNight: Math.min(...durations)
  }
}

function calculateHydrationStats(logs: HydrationLog[], goal: HydrationGoal | null): HydrationStats | null {
  if (logs.length === 0) return null

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLogs = logs.filter(l => l.logDate === today)
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amountMl, 0)

  const sevenDaysAgo = subDays(new Date(), 7)
  const weekLogs = logs.filter(l => new Date(l.logDate) >= sevenDaysAgo)
  
  // Group by date
  const dailyTotals: Record<string, number> = {}
  weekLogs.forEach(log => {
    dailyTotals[log.logDate] = (dailyTotals[log.logDate] || 0) + log.amountMl
  })

  const weekValues = Object.values(dailyTotals)
  const avgDailyLast7Days = weekValues.length > 0 ? weekValues.reduce((a, b) => a + b, 0) / weekValues.length : 0

  const dailyGoal = goal?.dailyGoalMl || 2000
  const progress = Math.min(100, (todayTotal / dailyGoal) * 100)

  return {
    todayTotal,
    dailyGoal,
    progress,
    logsToday: todayLogs.length,
    avgDailyLast7Days
  }
}

function calculateNutritionStats(meals: Meal[], goal: NutritionGoal | null): NutritionStats | null {
  if (meals.length === 0) return null

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayMeals = meals.filter(m => m.mealDate === today)

  const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
  const todayProtein = todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0)
  const todayCarbs = todayMeals.reduce((sum, meal) => sum + (meal.carbohydrates || 0), 0)
  const todayFats = todayMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0)

  const caloriesProgress = goal?.dailyCalories
    ? Math.min(100, (todayCalories / goal.dailyCalories) * 100)
    : 0

  return {
    todayCalories,
    todayProtein,
    todayCarbs,
    todayFats,
    dailyGoals: goal || undefined,
    caloriesProgress,
    mealsToday: todayMeals.length
  }
}

function generateInsights(
  weightStats: WeightStats | null,
  activityStats: ActivityStats | null,
  sleepStats: SleepStats | null,
  goals: HealthGoal[]
): HealthInsight[] {
  const insights: HealthInsight[] = []

  // Weight insights
  if (weightStats) {
    if (weightStats.trend === 'up') {
      insights.push({
        type: 'weight',
        title: 'Tendência de Peso',
        description: `Seu peso aumentou ${Math.abs(weightStats.changeFromStart || 0).toFixed(1)} kg nos últimos dias`,
        icon: '↗️',
        severity: 'warning'
      })
    } else if (weightStats.trend === 'down') {
      insights.push({
        type: 'weight',
        title: 'Tendência de Peso',
        description: `Você perdeu ${Math.abs(weightStats.changeFromStart || 0).toFixed(1)} kg nos últimos dias`,
        icon: '↘️',
        severity: 'success'
      })
    }
  }

  // Activity insights
  if (activityStats) {
    if (activityStats.weeklyProgress >= 100) {
      insights.push({
        type: 'activity',
        title: 'Meta de Atividade Atingida!',
        description: `Parabéns! Você completou ${activityStats.totalDuration} minutos esta semana`,
        icon: '🎯',
        severity: 'success'
      })
    } else if (activityStats.weeklyProgress < 50) {
      insights.push({
        type: 'activity',
        title: 'Atenção às Atividades',
        description: `Você está em ${activityStats.weeklyProgress.toFixed(0)}% da meta semanal. Faltam ${activityStats.weeklyGoal - activityStats.totalDuration} minutos`,
        icon: '⚡',
        severity: 'warning'
      })
    }
  }

  // Sleep insights
  if (sleepStats) {
    const avgHours = sleepStats.avgDuration / 60
    if (avgHours < 7) {
      insights.push({
        type: 'sleep',
        title: 'Sono Insuficiente',
        description: `Você está dormindo ${avgHours.toFixed(1)}h por noite. Recomendado: 7-9h`,
        icon: '😴',
        severity: 'warning'
      })
    } else if (avgHours >= 7 && avgHours <= 9) {
      insights.push({
        type: 'sleep',
        title: 'Sono Adequado',
        description: `Ótimo! Você está dormindo ${avgHours.toFixed(1)}h por noite`,
        icon: '😊',
        severity: 'success'
      })
    }
  }

  return insights
}
