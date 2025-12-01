'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreditCardAccounting } from '@/hooks/use-credit-card-accounting'

/**
 * Componente que exibe o Patrimônio Líquido do usuário
 * Fórmula: Ativos - Passivos
 * 
 * Exemplo:
 * - Conta Corrente: R$ 5.000 (ATIVO)
 * - Poupança: R$ 2.000 (ATIVO)
 * - Cartão Nubank: R$ -1.500 (PASSIVO/Dívida)
 * 
 * Patrimônio Líquido = R$ 5.500 (7.000 - 1.500)
 */
export function NetWorthCard() {
  const { getNetWorth, isLoading } = useCreditCardAccounting()
  const [netWorth, setNetWorth] = useState<{
    assets: number
    liabilities: number
    netWorth: number
  } | null>(null)

  const loadNetWorth = async () => {
    const result = await getNetWorth()
    if (result) {
      setNetWorth(result)
    }
  }

  useEffect(() => {
    loadNetWorth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading && !netWorth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patrimônio Líquido</CardTitle>
          <CardDescription>Calculando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!netWorth) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Ativos
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(netWorth.assets)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Recursos disponíveis
          </p>
        </CardContent>
      </Card>

      {/* Passivos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Passivos
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(netWorth.liabilities)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Dívidas (cartão de crédito)
          </p>
        </CardContent>
      </Card>

      {/* Patrimônio Líquido */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">
            Patrimônio Líquido
          </CardTitle>
          <DollarSign className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(netWorth.netWorth)}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Ativos - Passivos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
