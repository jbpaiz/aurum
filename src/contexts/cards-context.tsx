'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { CreditCard, CardProvider, DEFAULT_CARD_PROVIDERS } from '@/types/cards'
import { useAuth } from '@/contexts/auth-context'

interface CardsContextType {
  cards: CreditCard[]
  providers: CardProvider[]
  loading: boolean
  addCard: (card: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => Promise<void>
  updateCard: (id: string, updates: Partial<CreditCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  getCardsByProvider: (providerId: string) => CreditCard[]
  getProviderById: (id: string) => CardProvider | undefined
}

const CardsContext = createContext<CardsContextType | undefined>(undefined)

export function useCards() {
  const context = useContext(CardsContext)
  if (context === undefined) {
    throw new Error('useCards must be used within a CardsProvider')
  }
  return context
}

interface CardsProviderProps {
  children: ReactNode
}

export function CardsProvider({ children }: CardsProviderProps) {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [providers] = useState<CardProvider[]>(DEFAULT_CARD_PROVIDERS)
  const [loading, setLoading] = useState(true)

  const toCreditCard = useCallback((card: Database['public']['Tables']['cards']['Row']): CreditCard => ({
    id: card.id,
    providerId: card.provider_id,
    accountId: card.account_id,
    alias: card.alias,
    lastFourDigits: card.last_four_digits ?? undefined,
    type: card.type,
    isActive: card.is_active,
    createdAt: card.created_at,
    userId: card.user_id
  }), [])

  const fetchCards = useCallback(async () => {
    if (!user) {
      setCards([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar cartões:', error.message)
    }

    setCards((data ?? []).map(toCreditCard))
    setLoading(false)
  }, [toCreditCard, user])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const getDefaultAccountId = useCallback(async () => {
    if (!user) return null

    const { data } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    return data?.id ?? null
  }, [user])

  const addCard = useCallback(async (cardData: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return

    try {
      const accountId = cardData.accountId ?? await getDefaultAccountId()

      if (!accountId) {
        throw new Error('Nenhuma conta ativa disponível para vincular o cartão')
      }

      const payload: Database['public']['Tables']['cards']['Insert'] = {
        user_id: user.id,
        provider_id: cardData.providerId,
        account_id: accountId,
        alias: cardData.alias,
        last_four_digits: cardData.lastFourDigits ?? null,
        type: cardData.type,
        is_active: cardData.isActive
      }

      const { data, error } = await supabase
        .from('cards')
        .insert(payload)
        .select()
        .single()

      if (error) {
        throw error
      }

      setCards(prev => [...prev, toCreditCard(data)])
    } catch (error) {
      console.error('Erro ao salvar cartão no Supabase:', error)
    }
  }, [getDefaultAccountId, toCreditCard, user])

  const updateCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    if (!user) return

    try {
      const dbUpdates: Partial<Database['public']['Tables']['cards']['Update']> = {}
      if (updates.providerId !== undefined) dbUpdates.provider_id = updates.providerId
      if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId
      if (updates.alias !== undefined) dbUpdates.alias = updates.alias
      if (updates.lastFourDigits !== undefined) dbUpdates.last_four_digits = updates.lastFourDigits ?? null
      if (updates.type !== undefined) dbUpdates.type = updates.type
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      const { data, error } = await supabase
        .from('cards')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setCards(prev => prev.map(card => card.id === id ? toCreditCard(data) : card))
    } catch (error) {
      console.error('Erro ao atualizar cartão no Supabase:', error)
    }
  }, [toCreditCard, user])

  const deleteCard = useCallback(async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('cards')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setCards(prev => prev.filter(card => card.id !== id))
    } catch (error) {
      console.error('Erro ao remover cartão no Supabase:', error)
    }
  }, [user])

  const getCardsByProvider = (providerId: string) => {
    return cards.filter(card => card.providerId === providerId && card.isActive)
  }

  const getProviderById = (id: string) => {
    return providers.find(provider => provider.id === id)
  }

  const value: CardsContextType = {
    cards: cards.filter(card => card.isActive),
    providers,
    loading,
    addCard,
    updateCard,
    deleteCard,
    getCardsByProvider,
    getProviderById
  }

  return (
    <CardsContext.Provider value={value}>
      {children}
    </CardsContext.Provider>
  )
}
