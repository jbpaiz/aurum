'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface Budget {
  id: string
  category: string
  description: string
  amount: number
  month: string // Format: YYYY-MM
  createdAt: string
  userId: string
}

export function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .order('category', { ascending: true })

    if (error) {
      console.error('Erro ao carregar orçamentos:', error.message)
      setError(error.message)
      setBudgets([])
    } else {
      setBudgets((data || []).map((row: any) => ({
        id: row.id,
        category: row.category,
        description: row.description || '',
        amount: Number(row.amount),
        month: row.month,
        createdAt: row.created_at,
        userId: row.user_id
      })))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category: budgetData.category,
        description: budgetData.description,
        amount: budgetData.amount,
        month: budgetData.month
      } as any)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Falha ao criar orçamento')
    }

    const row: any = data
    setBudgets(prev => [{
      id: row.id,
      category: row.category,
      description: row.description || '',
      amount: Number(row.amount),
      month: row.month,
      createdAt: row.created_at,
      userId: row.user_id
    }, ...prev])
  }, [user])

  const updateBudget = useCallback(async (id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const dbUpdates: any = {}
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.month !== undefined) dbUpdates.month = updates.month

    const { data, error } = await supabase
      .from('budgets')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Falha ao atualizar orçamento')
    }

    const row: any = data
    setBudgets(prev => prev.map(budget => budget.id === id ? {
      id: row.id,
      category: row.category,
      description: row.description || '',
      amount: Number(row.amount),
      month: row.month,
      createdAt: row.created_at,
      userId: row.user_id
    } : budget))
  }, [user])

  const deleteBudget = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }, [user])

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget
  }
}
