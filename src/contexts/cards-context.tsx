'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CreditCard, CardProvider, DEFAULT_CARD_PROVIDERS } from '@/types/cards'
import { useAuth } from './auth-context'

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

  useEffect(() => {
    const loadUserCards = async () => {
      try {
        setLoading(true)
        
        // Em um app real, carregaria do Supabase
        // Por agora, usar localStorage ou criar dados de demonstração
        const storedCards = localStorage.getItem(`cards_${user?.id}`)
        if (storedCards) {
          setCards(JSON.parse(storedCards))
        } else {
          // Criar cartões de demonstração completos
          const demoCards: CreditCard[] = [
            {
              id: '1',
              providerId: 'nubank',
              alias: 'Nubank Roxinho',
              lastFourDigits: '1234',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '2',
              providerId: 'nubank',
              alias: 'Nu Débito',
              lastFourDigits: '5678',
              type: 'debit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '3',
              providerId: 'mercadopago',
              alias: 'Mercado Pago Gold',
              lastFourDigits: '9012',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '4',
              providerId: 'bb',
              alias: 'BB Ourocard Visa',
              lastFourDigits: '3456',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '5',
              providerId: 'bb',
              alias: 'BB Conta Corrente',
              lastFourDigits: '7890',
              type: 'debit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '6',
              providerId: 'caixa',
              alias: 'Caixa Mastercard',
              lastFourDigits: '2345',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '7',
              providerId: 'itau',
              alias: 'Itaucard Internacional',
              lastFourDigits: '6789',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '8',
              providerId: 'picpay',
              alias: 'PicPay Card',
              lastFourDigits: '1122',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '9',
              providerId: 'inter',
              alias: 'Inter Mastercard',
              lastFourDigits: '3344',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            },
            {
              id: '10',
              providerId: 'c6bank',
              alias: 'C6 Bank Carbon',
              lastFourDigits: '5566',
              type: 'credit',
              isActive: true,
              createdAt: new Date().toISOString(),
              userId: user?.id
            }
          ]
          setCards(demoCards)
          localStorage.setItem(`cards_${user?.id}`, JSON.stringify(demoCards))
        }
      } catch (error) {
        console.error('Erro ao carregar cartões:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadUserCards()
    } else {
      setCards([])
      setLoading(false)
    }
  }, [user])

  const addCard = async (cardData: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return

    const newCard: CreditCard = {
      ...cardData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: user.id
    }

    const updatedCards = [...cards, newCard]
    setCards(updatedCards)
    localStorage.setItem(`cards_${user.id}`, JSON.stringify(updatedCards))
  }

  const updateCard = async (id: string, updates: Partial<CreditCard>) => {
    if (!user) return

    const updatedCards = cards.map(card => 
      card.id === id ? { ...card, ...updates } : card
    )
    setCards(updatedCards)
    localStorage.setItem(`cards_${user.id}`, JSON.stringify(updatedCards))
  }

  const deleteCard = async (id: string) => {
    if (!user) return

    const updatedCards = cards.filter(card => card.id !== id)
    setCards(updatedCards)
    localStorage.setItem(`cards_${user.id}`, JSON.stringify(updatedCards))
  }

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
