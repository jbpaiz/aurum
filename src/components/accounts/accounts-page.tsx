'use client'

import { useState } from 'react'
import { 
  Plus, 
  CreditCard, 
  Building2, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/use-dashboard-data'

export function AccountsPage() {
  const { data, loading } = useDashboardData()
  const [showBalances, setShowBalances] = useState(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Building2 className="h-6 w-6" />
      case 'savings':
        return <Wallet className="h-6 w-6" />
      case 'investment':
        return <TrendingUp className="h-6 w-6" />
      default:
        return <CreditCard className="h-6 w-6" />
    }
  }

  const getAccountTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'checking': 'Conta Corrente',
      'savings': 'Poupança',
      'investment': 'Investimento',
      'credit': 'Cartão de Crédito'
    }
    return types[type] || type
  }

  const getTotalBalance = () => {
    if (!data?.accounts) return 0
    return data.accounts.reduce((total, account) => total + account.balance, 0)
  }

  const getPositiveBalanceAccounts = () => {
    if (!data?.accounts) return 0
    return data.accounts.filter(account => account.balance > 0).length
  }

  const getAccountsWithActivity = () => {
    // Simulando contas com atividade recente
    if (!data?.accounts) return 0
    return Math.min(data.accounts.length - 1, data.accounts.length)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando contas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-600">Gerencie suas contas bancárias e cartões</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBalances(!showBalances)}
            className="gap-2"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showBalances ? 'Ocultar Saldos' : 'Mostrar Saldos'}
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
            <Wallet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {showBalances ? formatCurrency(getTotalBalance()) : '••••••'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Todas as contas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Contas</CardTitle>
            <Building2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.accounts?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldos Positivos</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getPositiveBalanceAccounts()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Com recursos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atividade Recente</CardTitle>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getAccountsWithActivity()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Com movimentação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Contas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as suas contas bancárias e cartões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.accounts && data.accounts.length > 0 ? (
            <div className="space-y-4">
              {data.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{account.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getAccountTypeName(account.type)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {account.bank}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {showBalances ? formatCurrency(account.balance) : '••••••'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Saldo atual
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma conta cadastrada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando sua primeira conta bancária ou cartão
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Conta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
