'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface Goal {
  id: string
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  userId: string
}

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('financial_goals' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar metas:', error.message)
      setError(error.message)
      setGoals([])
    } else {
      setGoals((data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        targetAmount: Number(row.target_amount),
        currentAmount: Number(row.current_amount),
        targetDate: row.target_date,
        status: row.status as 'active' | 'completed' | 'cancelled',
        createdAt: row.created_at,
        userId: row.user_id
      })))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('financial_goals' as any)
      .insert({
        user_id: user.id,
        name: goalData.name,
        description: goalData.description,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        target_date: goalData.targetDate,
        status: goalData.status
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Falha ao criar meta')
    }

    const row: any = data
    setGoals(prev => [{
      id: row.id,
      name: row.name,
      description: row.description || '',
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      targetDate: row.target_date,
      status: row.status as 'active' | 'completed' | 'cancelled',
      createdAt: row.created_at,
      userId: row.user_id
    }, ...prev])
  }, [user])

  const updateGoal = useCallback(async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate
    if (updates.status !== undefined) dbUpdates.status = updates.status

    const { data, error } = await supabase
      .from('financial_goals' as any)
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Falha ao atualizar meta')
    }

    const row: any = data
    setGoals(prev => prev.map(goal => goal.id === id ? {
      id: row.id,
      name: row.name,
      description: row.description || '',
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      targetDate: row.target_date,
      status: row.status as 'active' | 'completed' | 'cancelled',
      createdAt: row.created_at,
      userId: row.user_id
    } : goal))
  }, [user])

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('financial_goals' as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    setGoals(prev => prev.filter(goal => goal.id !== id))
  }, [user])

  return {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal
  }
}
