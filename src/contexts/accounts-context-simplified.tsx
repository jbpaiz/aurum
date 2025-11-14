'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { BankAccount, DEFAULT_BANKS } from '@/types/accounts'

interface AccountsContextType {
  accounts: BankAccount[]
  loading: boolean
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  getAccountById: (id: string) => BankAccount | undefined
  updateAccountBalance: (accountId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>
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

  useEffect(() => {
    const loadUserAccounts = async () => {
      if (!user) {
        setAccounts([])
        setLoading(false)
        return
      }

      try {
        // Tentar carregar do Supabase primeiro
        const { data: accountsData, error: accountsError } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (accountsData && accountsData.length > 0) {
          const formattedAccounts = accountsData.map(account => ({
            id: account.id,
            name: account.name,
            type: account.type,
            bank: account.bank ?? undefined,
            icon: account.icon,
            color: account.color,
            balance: account.balance,
            isActive: account.is_active,
            createdAt: account.created_at,
            userId: account.user_id
          }))
          setAccounts(formattedAccounts)
        } else {
          // Se não há dados no Supabase, verificar localStorage
          const storedAccounts = localStorage.getItem(`accounts_${user.id}`)
          if (storedAccounts) {
            setAccounts(JSON.parse(storedAccounts))
          } else {
            // Criar dados demo se não há nada
            await createDemoData()
          }
        }
      } catch (error) {
        console.error('Erro ao carregar contas:', error)
        // Fallback para localStorage
        const storedAccounts = localStorage.getItem(`accounts_${user.id}`)
        if (storedAccounts) {
          setAccounts(JSON.parse(storedAccounts))
        } else {
          await createDemoData()
        }
      } finally {
        setLoading(false)
      }
    }

    const createDemoData = async () => {
      const demoAccounts: BankAccount[] = [
        {
          id: 'acc_1',
          name: 'Carteira',
          type: 'wallet',
          icon: 'Wallet',
          color: '#10B981',
          balance: 120.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_2',
          name: 'Cofrinho',
          type: 'wallet',
          icon: 'PiggyBank',
          color: '#F59E0B',
          balance: 450.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_3',
          name: 'Nubank',
          type: 'checking',
          bank: 'nubank',
          icon: 'CreditCard',
          color: '#8A05BE',
          balance: 2500.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_4',
          name: 'BB Poupança',
          type: 'savings',
          bank: 'bb',
          icon: 'PiggyBank',
          color: '#FFED00',
          balance: 8750.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_5',
          name: 'Caixa Poupança',
          type: 'savings',
          bank: 'caixa',
          icon: 'Building2',
          color: '#0072CE',
          balance: 15200.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_6',
          name: 'Itaú Conta Corrente',
          type: 'checking',
          bank: 'itau',
          icon: 'Building2',
          color: '#EC7000',
          balance: 3200.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'acc_7',
          name: 'Inter Investimentos',
          type: 'investment',
          bank: 'inter',
          icon: 'TrendingUp',
          color: '#FF7A00',
          balance: 12500.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        }
      ]

      setAccounts(demoAccounts)
      
      // Salvar no localStorage como backup
      localStorage.setItem(`accounts_${user?.id}`, JSON.stringify(demoAccounts))

      // Tentar salvar no Supabase (opcional, sem bloquear se falhar)
      try {
        await saveToSupabase(demoAccounts)
      } catch (error) {
        console.error('Erro ao salvar no Supabase:', error)
      }
    }

    const saveToSupabase = async (accountsToSave: BankAccount[]) => {
      if (!user) return

      // Salvar contas
      const accountsForDb = accountsToSave.map(account => ({
        id: account.id,
        user_id: user.id,
        name: account.name,
        type: account.type,
        bank: account.bank,
        icon: account.icon,
        color: account.color,
        balance: account.balance,
        is_active: account.isActive
      }))

      const { error: accountsError } = await supabase
        .from('bank_accounts')
        .upsert(accountsForDb)

      if (accountsError) console.error('Erro ao salvar contas:', accountsError)
    }

    loadUserAccounts()
  }, [user])

  const addAccount = async (accountData: Omit<BankAccount, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return

    const newAccount: BankAccount = {
      ...accountData,
      id: `acc_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id
    }

    const updatedAccounts = [...accounts, newAccount]
    setAccounts(updatedAccounts)
    localStorage.setItem(`accounts_${user.id}`, JSON.stringify(updatedAccounts))

    // Tentar salvar no Supabase
    try {
      await supabase.from('bank_accounts').insert({
        id: newAccount.id,
        user_id: user.id,
        name: newAccount.name,
        type: newAccount.type,
        bank: newAccount.bank,
        icon: newAccount.icon,
        color: newAccount.color,
        balance: newAccount.balance,
        is_active: newAccount.isActive
      })
    } catch (error) {
      console.error('Erro ao salvar conta no Supabase:', error)
    }
  }

  const updateAccount = async (id: string, updates: Partial<BankAccount>) => {
    if (!user) return

    const updatedAccounts = accounts.map(account => 
      account.id === id ? { ...account, ...updates } : account
    )
    setAccounts(updatedAccounts)
    localStorage.setItem(`accounts_${user.id}`, JSON.stringify(updatedAccounts))

    // Tentar atualizar no Supabase
    try {
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.name = updates.name
      if (updates.type) dbUpdates.type = updates.type
      if (updates.bank !== undefined) dbUpdates.bank = updates.bank
      if (updates.icon) dbUpdates.icon = updates.icon
      if (updates.color) dbUpdates.color = updates.color
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      await supabase
        .from('bank_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Erro ao atualizar conta no Supabase:', error)
    }
  }

  const deleteAccount = async (id: string) => {
    if (!user) return

    const updatedAccounts = accounts.filter(account => account.id !== id)
    
    setAccounts(updatedAccounts)
    localStorage.setItem(`accounts_${user.id}`, JSON.stringify(updatedAccounts))

    // Tentar deletar no Supabase
    try {
      await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Erro ao deletar conta no Supabase:', error)
    }
  }

  const getAccountById = (id: string) => {
    return accounts.find(account => account.id === id)
  }

  const updateAccountBalance = async (accountId: string, amount: number, operation: 'add' | 'subtract') => {
    if (!user) return

    const updatedAccounts = accounts.map(account => {
      if (account.id === accountId) {
        const newBalance = operation === 'add' 
          ? account.balance + amount 
          : account.balance - amount
        return { ...account, balance: newBalance }
      }
      return account
    })

    setAccounts(updatedAccounts)
    localStorage.setItem(`accounts_${user.id}`, JSON.stringify(updatedAccounts))

    // Tentar atualizar no Supabase
    try {
      const account = updatedAccounts.find(acc => acc.id === accountId)
      if (account) {
        await supabase
          .from('bank_accounts')
          .update({ balance: account.balance })
          .eq('id', accountId)
          .eq('user_id', user.id)
      }
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
    updateAccountBalance
  }

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  )
}
