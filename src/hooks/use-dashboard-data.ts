'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface DashboardData {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  accounts: Array<{
    id: string
    name: string
    balance: number
    color: string
    type: string
    bank: string
  }>
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    date: string
    category: string
  }>
  categoryExpenses: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export function useDashboardData() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Carregar contas
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)

        // Carregar transações do mês atual
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
        const { data: transactions } = await supabase
          .from('transactions')
          .select(`
            *,
            categories (name)
          `)
          .eq('user_id', user.id)
          .gte('transaction_date', currentMonth)
          .order('transaction_date', { ascending: false })

        // Calcular totais
        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0
        const monthlyIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
        const monthlyExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0

        // Preparar dados das contas
        const accountsData = accounts?.map(acc => ({
          id: acc.id,
          name: acc.name,
          balance: Number(acc.balance),
          color: acc.color || '#6B7280',
          type: acc.type,
          bank: acc.bank || 'Conta'
        })) || []

        // Preparar transações recentes
        const recentTransactions = transactions?.slice(0, 5).map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          type: (t.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          date: t.transaction_date,
          category: (t as any).categories?.name || 'Sem categoria'
        })) || []

        // Calcular despesas por categoria
        const expenseTransactions = transactions?.filter(t => t.type === 'expense') || []
        const categoryTotals: Record<string, number> = {}
        
        expenseTransactions.forEach(t => {
          const category = (t as any).categories?.name || 'Outros'
          categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.amount)
        })

        const totalCategoryExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
        const categoryExpenses = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalCategoryExpenses > 0 ? Math.round((amount / totalCategoryExpenses) * 100) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        setData({
          balance: totalBalance,
          monthlyIncome,
          monthlyExpenses,
          accounts: accountsData,
          recentTransactions,
          categoryExpenses
        })

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const refresh = () => {
    loadData()
  }

  return { data, loading, refresh }
}
