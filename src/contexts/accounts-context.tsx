'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BankAccount, PaymentMethod, DEFAULT_BANKS } from '@/types/accounts'
import { useAuth } from './auth-context'
import { useCards } from './cards-context'
import { supabase } from '@/lib/supabase'

interface AccountsContextType {
  accounts: BankAccount[]
  paymentMethods: PaymentMethod[]
  banks: typeof DEFAULT_BANKS
  loading: boolean
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  updateAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>
  deletePaymentMethod: (id: string) => Promise<void>
  getAccountById: (id: string) => BankAccount | undefined
  getPaymentMethodById: (id: string) => PaymentMethod | undefined
  getPaymentMethodsByAccount: (accountId: string) => PaymentMethod[]
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
  const { cards } = useCards()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserAccounts = async () => {
      if (!user) {
        setAccounts([])
        setPaymentMethods([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Tentar carregar do Supabase primeiro
        const { data: accountsData, error: accountsError } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (!accountsError && !paymentMethodsError && accountsData && paymentMethodsData) {
          // Dados carregados do Supabase com sucesso
          setAccounts(accountsData.map(account => ({
            id: account.id,
            name: account.name,
            type: account.type as BankAccount['type'],
            bank: account.bank,
            icon: account.icon,
            color: account.color,
            balance: account.balance,
            isActive: account.is_active,
            createdAt: account.created_at,
            userId: account.user_id
          })))

          setPaymentMethods(paymentMethodsData.map(method => ({
            id: method.id,
            name: method.name,
            type: method.type as PaymentMethod['type'],
            accountId: method.account_id,
            cardId: method.card_id,
            icon: method.icon,
            color: method.color,
            isActive: method.is_active,
            createdAt: method.created_at,
            userId: method.user_id
          })))
        } else {
          // Fallback para localStorage se Supabase falhar ou não tiver dados
          console.log('Fallback para localStorage - Supabase:', { accountsError, paymentMethodsError })
          
          const storedAccounts = localStorage.getItem(`accounts_${user?.id}`)
          const storedPaymentMethods = localStorage.getItem(`payment_methods_${user?.id}`)
          
          if (storedAccounts && storedPaymentMethods) {
            setAccounts(JSON.parse(storedAccounts))
            setPaymentMethods(JSON.parse(storedPaymentMethods))
          } else {
            // Criar dados demo se não existir nada
            await createDemoData()
          }
        }
      } catch (error) {
        console.error('Erro ao carregar contas:', error)
        // Fallback para localStorage em caso de erro
        const storedAccounts = localStorage.getItem(`accounts_${user?.id}`)
        const storedPaymentMethods = localStorage.getItem(`payment_methods_${user?.id}`)
        
        if (storedAccounts && storedPaymentMethods) {
          setAccounts(JSON.parse(storedAccounts))
          setPaymentMethods(JSON.parse(storedPaymentMethods))
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

      const demoPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          name: 'Dinheiro - Carteira',
          type: 'cash',
          accountId: 'acc_1',
          icon: '💵',
          color: '#10B981',
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'pm_2',
          name: 'PIX - Nubank',
          type: 'pix',
          accountId: 'acc_3',
          icon: '📱',
          color: '#8A05BE',
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'pm_3',
          name: 'PIX - Itaú',
          type: 'pix',
          accountId: 'acc_6',
          icon: '📱',
          color: '#EC7000',
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'pm_4',
          name: 'Transferência BB',
          type: 'bank_transfer',
          accountId: 'acc_4',
          icon: '🔄',
          color: '#FFED00',
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        },
        {
          id: 'pm_5',
          name: 'Transferência Caixa',
          type: 'bank_transfer',
          accountId: 'acc_5',
          icon: '🔄',
          color: '#0072CE',
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        }
      ]

      // Adicionar métodos de pagamento para cartões
      cards.forEach((card, index) => {
        const account = demoAccounts.find(acc => acc.bank === card.providerId) || demoAccounts[2]
        const isCredit = card.type === 'credit'
        
        demoPaymentMethods.push({
          id: `pm_card_${card.id}`,
          name: `${card.alias}`,
          type: isCredit ? 'credit_card' : 'debit_card',
          accountId: account.id,
          cardId: card.id,
          icon: isCredit ? '💳' : '🏧',
          color: account.color,
          isActive: true,
          createdAt: new Date().toISOString(),
          userId: user?.id
        })
      })

      setAccounts(demoAccounts)
      setPaymentMethods(demoPaymentMethods)
      
      // Salvar no localStorage como backup
      localStorage.setItem(`accounts_${user?.id}`, JSON.stringify(demoAccounts))
      localStorage.setItem(`payment_methods_${user?.id}`, JSON.stringify(demoPaymentMethods))

      // Tentar salvar no Supabase (opcional, sem bloquear se falhar)
      try {
        await saveToSupabase(demoAccounts, demoPaymentMethods)
      } catch (error) {
        console.log('Não foi possível salvar no Supabase:', error)
      }
    }

    const saveToSupabase = async (accountsToSave: BankAccount[], methodsToSave: PaymentMethod[]) => {
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

      // Salvar métodos de pagamento
      const methodsForDb = methodsToSave.map(method => ({
        id: method.id,
        user_id: user.id,
        name: method.name,
        type: method.type,
        account_id: method.accountId,
        card_id: method.cardId,
        icon: method.icon,
        color: method.color,
        is_active: method.isActive
      }))

      const { error: methodsError } = await supabase
        .from('payment_methods')
        .upsert(methodsForDb)

      if (accountsError) console.error('Erro ao salvar contas:', accountsError)
      if (methodsError) console.error('Erro ao salvar métodos:', methodsError)
    }

    loadUserAccounts()
  }, [user, cards])

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
    const updatedPaymentMethods = paymentMethods.filter(pm => pm.accountId !== id)
    
    setAccounts(updatedAccounts)
    setPaymentMethods(updatedPaymentMethods)
    localStorage.setItem(`accounts_${user.id}`, JSON.stringify(updatedAccounts))
    localStorage.setItem(`payment_methods_${user.id}`, JSON.stringify(updatedPaymentMethods))

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

  const addPaymentMethod = async (methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return

    const newMethod: PaymentMethod = {
      ...methodData,
      id: `pm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id
    }

    const updatedMethods = [...paymentMethods, newMethod]
    setPaymentMethods(updatedMethods)
    localStorage.setItem(`payment_methods_${user.id}`, JSON.stringify(updatedMethods))

    // Tentar salvar no Supabase
    try {
      await supabase.from('payment_methods').insert({
        id: newMethod.id,
        user_id: user.id,
        name: newMethod.name,
        type: newMethod.type,
        account_id: newMethod.accountId,
        card_id: newMethod.cardId,
        icon: newMethod.icon,
        color: newMethod.color,
        is_active: newMethod.isActive
      })
    } catch (error) {
      console.error('Erro ao salvar método no Supabase:', error)
    }
  }

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    if (!user) return

    const updatedMethods = paymentMethods.map(method => 
      method.id === id ? { ...method, ...updates } : method
    )
    setPaymentMethods(updatedMethods)
    localStorage.setItem(`payment_methods_${user.id}`, JSON.stringify(updatedMethods))

    // Tentar atualizar no Supabase
    try {
      const dbUpdates: any = {}
      if (updates.name) dbUpdates.name = updates.name
      if (updates.type) dbUpdates.type = updates.type
      if (updates.accountId) dbUpdates.account_id = updates.accountId
      if (updates.cardId !== undefined) dbUpdates.card_id = updates.cardId
      if (updates.icon) dbUpdates.icon = updates.icon
      if (updates.color) dbUpdates.color = updates.color
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      await supabase
        .from('payment_methods')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Erro ao atualizar método no Supabase:', error)
    }
  }

  const deletePaymentMethod = async (id: string) => {
    if (!user) return

    const updatedMethods = paymentMethods.filter(method => method.id !== id)
    setPaymentMethods(updatedMethods)
    localStorage.setItem(`payment_methods_${user.id}`, JSON.stringify(updatedMethods))

    // Tentar deletar no Supabase
    try {
      await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Erro ao deletar método no Supabase:', error)
    }
  }

  const getAccountById = (id: string) => {
    return accounts.find(account => account.id === id)
  }

  const getPaymentMethodById = (id: string) => {
    return paymentMethods.find(method => method.id === id)
  }

  const getPaymentMethodsByAccount = (accountId: string) => {
    return paymentMethods.filter(method => method.accountId === accountId && method.isActive)
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
      const account = accounts.find(acc => acc.id === accountId)
      if (account) {
        const newBalance = operation === 'add' 
          ? account.balance + amount 
          : account.balance - amount

        await supabase
          .from('bank_accounts')
          .update({ balance: newBalance })
          .eq('id', accountId)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Erro ao atualizar saldo no Supabase:', error)
    }
  }

  const value: AccountsContextType = {
    accounts: accounts.filter(account => account.isActive),
    paymentMethods: paymentMethods.filter(method => method.isActive),
    banks: DEFAULT_BANKS,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getAccountById,
    getPaymentMethodById,
    getPaymentMethodsByAccount,
    updateAccountBalance
  }

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  )
}
