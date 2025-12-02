'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Database } from '@/lib/database.types'
import { registerCreditCardPurchase } from '@/lib/credit-card-service'

export type TransactionType = 'income' | 'expense' | 'transfer'
type IncomeExpenseType = 'income' | 'expense'

type TransactionRow = Database['public']['Tables']['transactions']['Row'] & {
  categories?: { name: string | null } | null
  payment_methods?: { id: string; name: string | null; card_id: string | null } | null
}

export interface TransactionRecord {
  id: string
  type: TransactionType
  description: string
  amount: number
  category: string
  date: string
  accountId?: string
  paymentMethod?: string
  cardId?: string
  installments?: number
}

export interface TransactionFormData {
  type: IncomeExpenseType
  description: string
  amount: number
  category: string
  date: string
  accountId?: string // Opcional agora (obrigatório só quando NÃO for cartão de crédito)
  paymentMethod?: string
  cardId?: string // ID do cartão quando for compra no crédito
  installments?: number
}

const parsePaymentMethodFromNotes = (notes: string | null): string | undefined => {
  if (!notes) return undefined
  try {
    const parsed = JSON.parse(notes)
    if (typeof parsed.paymentMethod === 'string') {
      return parsed.paymentMethod
    }
  } catch {
    // Ignorar notas que não estejam no formato esperado
  }
  return undefined
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const mapTransactionRow = useCallback((row: TransactionRow): TransactionRecord => ({
    id: row.id,
    type: row.type,
    description: row.description,
    amount: Number(row.amount ?? 0),
    category: row.categories?.name || 'Sem categoria',
    date: row.transaction_date,
    accountId: row.account_id ?? undefined,
    paymentMethod: row.payment_methods?.name || parsePaymentMethodFromNotes(row.notes),
    cardId: row.payment_methods?.card_id ?? undefined,
    installments: row.installments ?? undefined
  }), [])

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (name),
        payment_methods (id, name, card_id)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('Erro ao carregar transações:', error.message)
      setError(error.message)
      setTransactions([])
    } else {
      setTransactions((data ?? []).map(mapTransactionRow))
    }

    setLoading(false)
  }, [mapTransactionRow, user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const getOrCreateCategoryId = useCallback(
  async (categoryName: string, type: IncomeExpenseType): Promise<string | null> => {
      if (!categoryName) return null
      if (!user) throw new Error('Usuário não autenticado')

      const { data: existingCategory, error: searchError } = await supabase
        .from('categories')
        .select('id, user_id')
        .eq('name', categoryName)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('user_id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (searchError) {
        console.error('Erro ao buscar categoria:', searchError.message)
      }

      if (existingCategory) {
        return existingCategory.id
      }

      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          type,
          user_id: user.id
        })
        .select('id')
        .single()

      if (createError || !newCategory) {
        throw new Error(createError?.message || 'Não foi possível criar a categoria')
      }

      return newCategory.id
    },
    [user]
  )

  const addTransaction = useCallback(async (transactionData: TransactionFormData) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    setIsSaving(true)

    try {
      // SE FOR COMPRA NO CARTÃO DE CRÉDITO, usar sistema de faturas
      if (transactionData.type === 'expense' && 
          transactionData.paymentMethod === 'credit_card' && 
          transactionData.cardId) {
        
        const categoryId = await getOrCreateCategoryId(transactionData.category, 'expense')
        
        const result = await registerCreditCardPurchase({
          userId: user.id,
          cardId: transactionData.cardId,
          amount: transactionData.amount,
          description: transactionData.description,
          categoryId: categoryId || undefined,
          purchaseDate: transactionData.date,
          installments: transactionData.installments ?? 1,
          notes: `Método: Cartão de Crédito`
        })

        if (!result.success) {
          throw new Error(result.error || 'Falha ao registrar compra no cartão')
        }

        // Recarregar transações para mostrar a nova compra
        await fetchTransactions()
        return
      }

      // FLUXO NORMAL para outras transações
      if (!transactionData.accountId) {
        throw new Error('Selecione uma conta para registrar a transação')
      }

      const categoryId = await getOrCreateCategoryId(transactionData.category, transactionData.type)
      const installments = transactionData.installments ?? 1
      const notes = transactionData.paymentMethod
        ? JSON.stringify({ paymentMethod: transactionData.paymentMethod })
        : null

      const insertPayload: Database['public']['Tables']['transactions']['Insert'] = {
        user_id: user.id,
        type: transactionData.type,
        description: transactionData.description,
        amount: transactionData.amount,
        category_id: categoryId,
        account_id: transactionData.accountId,
        transaction_date: transactionData.date,
        payment_method_id: null,
        installments,
        current_installment: 1,
        is_installment: installments > 1,
        notes
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertPayload)
        .select(`
          *,
          categories (name),
          payment_methods (id, name, card_id)
        `)
        .single()

      if (error || !data) {
        throw new Error(error?.message || 'Falha ao salvar transação')
      }

      setTransactions(prev => [mapTransactionRow(data), ...prev])
    } finally {
      setIsSaving(false)
    }
  }, [getOrCreateCategoryId, mapTransactionRow, user, fetchTransactions])

  const updateTransaction = useCallback(async (id: string, updates: Partial<TransactionFormData>) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const dbUpdates: Database['public']['Tables']['transactions']['Update'] = {}

    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.date !== undefined) dbUpdates.transaction_date = updates.date
    if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId
    if (updates.installments !== undefined) {
      dbUpdates.installments = updates.installments
      dbUpdates.is_installment = (updates.installments ?? 1) > 1
    }

    if (updates.category !== undefined) {
      const targetType = updates.type ?? transactions.find(transaction => transaction.id === id)?.type
      if (targetType === 'income' || targetType === 'expense') {
        const categoryId = await getOrCreateCategoryId(updates.category, targetType)
        dbUpdates.category_id = categoryId
      }
    }

    if (updates.paymentMethod !== undefined) {
      dbUpdates.notes = updates.paymentMethod
        ? JSON.stringify({ paymentMethod: updates.paymentMethod })
        : null
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        categories (name),
        payment_methods (id, name, card_id)
      `)
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Falha ao atualizar transação')
    }

    setTransactions(prev => prev.map(transaction => transaction.id === id ? mapTransactionRow(data) : transaction))
  }, [getOrCreateCategoryId, mapTransactionRow, transactions, user])

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    setTransactions(prev => prev.filter(transaction => transaction.id !== id))
  }, [user])

  return {
    transactions,
    loading,
    error,
    isSaving,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  }
}
