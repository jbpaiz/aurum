'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { BankAccount } from '@/types/accounts'

interface AccountsContextType {
  accounts: BankAccount[]
  loading: boolean
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  getAccountById: (id: string) => BankAccount | undefined
  updateAccountBalance: (accountId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>
  refresh: () => Promise<void>
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined)

export function useAccounts() {
  const context = useContext(AccountsContext)
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider')
  }
  return context
}

interface AccountsProviderProps {
  children: ReactNode
}

export function AccountsProvider({ children }: AccountsProviderProps) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  const toBankAccount = useCallback((account: Database['public']['Tables']['bank_accounts']['Row']): BankAccount => ({
    id: account.id,
    name: account.name,
    type: account.type as BankAccount['type'],
    bank: account.bank ?? undefined,
    icon: account.icon,
    color: account.color,
    balance: Number(account.balance ?? 0),
    isActive: account.is_active,
    createdAt: account.created_at || new Date().toISOString(),
    userId: account.user_id
  }), [])

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar contas:', error.message)
    }

    setAccounts((data ?? []).map(toBankAccount))
    setLoading(false)
  }, [toBankAccount, user])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const addAccount = async (accountData: Omit<BankAccount, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          name: accountData.name,
          type: accountData.type,
          bank: accountData.bank ?? null,
          icon: accountData.icon,
          color: accountData.color,
          balance: accountData.balance,
          is_active: accountData.isActive
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setAccounts(prev => [...prev, toBankAccount(data)])
    } catch (error) {
      console.error('Erro ao salvar conta no Supabase:', error)
    }
  }

  const updateAccount = async (id: string, updates: Partial<BankAccount>) => {
    if (!user) return

    try {
      const dbUpdates: Partial<Database['public']['Tables']['bank_accounts']['Update']> = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.type !== undefined) dbUpdates.type = updates.type
      if (updates.bank !== undefined) dbUpdates.bank = updates.bank ?? null
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      const { data, error } = await supabase
        .from('bank_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setAccounts(prev => prev.map(account => account.id === id ? toBankAccount(data) : account))
    } catch (error) {
      console.error('Erro ao atualizar conta no Supabase:', error)
    }
  }

  const deleteAccount = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setAccounts(prev => prev.filter(account => account.id !== id))
    } catch (error) {
      console.error('Erro ao deletar conta no Supabase:', error)
    }
  }

  const getAccountById = (id: string) => {
    return accounts.find(account => account.id === id)
  }

  const updateAccountBalance = async (accountId: string, amount: number, operation: 'add' | 'subtract') => {
    if (!user) return

    try {
      const currentAccount = accounts.find(acc => acc.id === accountId)

      if (!currentAccount) return

      const newBalance = operation === 'add'
        ? currentAccount.balance + amount
        : currentAccount.balance - amount

      const { data, error } = await supabase
        .from('bank_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setAccounts(prev => prev.map(account => account.id === accountId ? toBankAccount(data) : account))
    } catch (error) {
      console.error('Erro ao atualizar saldo no Supabase:', error)
    }
  }

  const value: AccountsContextType = {
    accounts: accounts.filter(account => account.isActive),
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    updateAccountBalance,
    refresh: fetchAccounts
  }

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  )
}
