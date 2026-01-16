'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type {
  WeightLog,
  Activity,
  SleepLog,
  HealthGoal,
  CreateWeightLogInput,
  CreateActivityInput,
  CreateSleepLogInput,
  CreateGoalInput,
  UpdateWeightLogInput,
  UpdateActivityInput,
  UpdateSleepLogInput,
  UpdateGoalInput,
  WeightStats,
  ActivityStats,
  SleepStats,
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
  
  // Stats
  weightStats: WeightStats | null
  activityStats: ActivityStats | null
  sleepStats: SleepStats | null
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
  
  // Carregar dados
  const loadData = useCallback(async () => {
    if (!user) {
      setWeightLogs([])
      setActivities([])
      setSleepLogs([])
      setGoals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Buscar últimos 90 dias
      const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
      
      const [weightRes, activitiesRes, sleepRes, goalsRes] = await Promise.all([
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

  // ===== STATS =====
  const weightStats: WeightStats | null = calculateWeightStats(weightLogs)
  const activityStats: ActivityStats | null = calculateActivityStats(activities, goals)
  const sleepStats: SleepStats | null = calculateSleepStats(sleepLogs)
  const insights: HealthInsight[] = generateInsights(weightStats, activityStats, sleepStats, goals)

  const value: HealthContextValue = {
    loading,
    weightLogs,
    activities,
    sleepLogs,
    goals,
    weightStats,
    activityStats,
    sleepStats,
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
