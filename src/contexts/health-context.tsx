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
import { differenceInMinutes, format, startOfDay, subDays } from 'date-fns'

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
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Buscar últimos 90 dias
      const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
      
      const [weightRes, activitiesRes, sleepRes, goalsRes, measurementsRes, hydrationRes, hydrationGoalRes, mealsRes, nutritionGoalRes] = await Promise.all([
        supabase
          .from('health_weight_logs')
          .select('*')
          .gte('recorded_at', ninetyDaysAgo)
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
          .single(),
        
        supabase
          .from('health_meals')
          .select('*')
          .gte('meal_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('meal_date', { ascending: false })
          .order('meal_time', { ascending: false }),
        
        supabase
          .from('health_nutrition_goals')
          .select('*')
          .single()
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
    if (!user) return

    const bedtime = new Date(input.bedtime)
    const wakeTime = new Date(input.wakeTime)
    const durationMinutes = differenceInMinutes(wakeTime, bedtime)

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

  // ===== STATS =====
  const weightStats: WeightStats | null = calculateWeightStats(weightLogs)
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

// ===== CALCULATORS =====
function calculateWeightStats(logs: WeightLog[]): WeightStats | null {
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

  return {
    current,
    min,
    max,
    avg,
    trend,
    changeFromStart: current - weights[weights.length - 1],
    changeFromYesterday,
    todayCount: todayLogs.length
  }
}

function calculateActivityStats(activities: Activity[], goals: HealthGoal[]): ActivityStats | null {
  const sevenDaysAgo = subDays(new Date(), 7)
  const weekActivities = activities.filter(a => new Date(a.activityDate) >= sevenDaysAgo)
  
  const totalDuration = weekActivities.reduce((sum, a) => sum + a.durationMinutes, 0)
  const totalCalories = weekActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)
  
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
