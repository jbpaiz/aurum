/**
 * Hook para operações contábeis de cartão de crédito
 * Facilita o uso do serviço de contabilidade nos componentes React
 */

import { useState } from 'react'
import { 
  registerCreditCardPurchase, 
  payCreditCardInvoice, 
  calculateNetWorth 
} from '@/lib/credit-card-accounting'
import { useAuth } from '@/contexts/auth-context'

export function useCreditCardAccounting() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Registra uma compra no cartão de crédito
   */
  const registerPurchase = async (params: {
    creditCardId: string
    amount: number
    description: string
    categoryId?: string
    date: string
    notes?: string
  }) => {
    if (!user) {
      setError('Usuário não autenticado')
      return { success: false }
    }

    setIsLoading(true)
    setError(null)

    const result = await registerCreditCardPurchase({
      userId: user.id,
      ...params
    })

    if (!result.success) {
      setError(result.error || 'Erro ao registrar compra')
    }

    setIsLoading(false)
    return result
  }

  /**
   * Registra o pagamento de fatura do cartão
   */
  const payInvoice = async (params: {
    checkingAccountId: string
    creditCardId: string
    amount: number
    date: string
    description?: string
  }) => {
    if (!user) {
      setError('Usuário não autenticado')
      return { success: false }
    }

    setIsLoading(true)
    setError(null)

    const result = await payCreditCardInvoice({
      userId: user.id,
      ...params
    })

    if (!result.success) {
      setError(result.error || 'Erro ao processar pagamento')
    }

    setIsLoading(false)
    return result
  }

  /**
   * Calcula o patrimônio líquido do usuário
   */
  const getNetWorth = async () => {
    if (!user) {
      setError('Usuário não autenticado')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await calculateNetWorth(user.id)
      setIsLoading(false)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao calcular patrimônio'
      setError(message)
      setIsLoading(false)
      return null
    }
  }

  return {
    registerPurchase,
    payInvoice,
    getNetWorth,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}
