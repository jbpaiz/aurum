'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Eye,
  EyeOff,
  CalendarDays,
  UserPlus,
  LogIn
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionModal } from '@/components/modals/transaction-modal'
import { TransactionList } from '@/components/transactions/transaction-list'
import { AuthModal } from '@/components/auth/auth-modal'
import { UserMenu } from '@/components/auth/user-menu'
import { useAuth } from '@/contexts/auth-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  paymentMethod?: string
  accountId?: string
  cardId?: string
  installments?: number
}

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export function Landing() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0
  })

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual Supabase query
      const mockTransactions: Transaction[] = []
      setTransactions(mockTransactions)
      calculateSummary(mockTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadTransactions()
    } else {
      setLoading(false)
    }
  }, [user, loadTransactions])

  const calculateSummary = (transactions: Transaction[]) => {
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount
      } else {
        acc.totalExpenses += transaction.amount
      }
      return acc
    }, { totalIncome: 0, totalExpenses: 0 })

    setFinancialSummary({
      ...summary,
      balance: summary.totalIncome - summary.totalExpenses,
      transactionCount: transactions.length
    })
  }

  const handleTransactionAdded = (transaction: Transaction | Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: 'id' in transaction ? transaction.id : `temp-${Date.now()}`
    }
    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    calculateSummary(updatedTransactions)
  }

  const handleTransactionUpdated = (transaction: Transaction) => {
    const updatedTransactions = transactions.map(t => 
      t.id === transaction.id ? transaction : t
    )
    setTransactions(updatedTransactions)
    calculateSummary(updatedTransactions)
  }

  const handleTransactionDeleted = (transactionId: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== transactionId)
    setTransactions(updatedTransactions)
    calculateSummary(updatedTransactions)
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Aurum Finance</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openAuthModal('login')}
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Entrar</span>
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openAuthModal('register')}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Cadastrar</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-600">
                Aqui está o resumo das suas finanças
              </p>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                  <TrendingUp className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialSummary.totalIncome)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  <TrendingDown className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialSummary.totalExpenses)}
                  </div>
                </CardContent>
              </Card>

              <Card className={`${financialSummary.balance >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    {isBalanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isBalanceVisible ? formatCurrency(financialSummary.balance) : '••••••'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transações</CardTitle>
                  <CalendarDays className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {financialSummary.transactionCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center">
              <Button
                onClick={() => setIsTransactionModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Nova Transação
              </Button>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>
                  Suas últimas movimentações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={transactions}
                  onEdit={handleTransactionUpdated}
                  onDelete={handleTransactionDeleted}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Landing Page for Non-Authenticated Users */
          <div className="text-center space-y-12">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Controle suas finanças com
                <span className="text-blue-600 block">Aurum Finance</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A maneira mais simples e inteligente de gerenciar seu dinheiro. 
                Acompanhe receitas, despesas e alcance seus objetivos financeiros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center p-6">
                <CardHeader>
                  <div className="mx-auto bg-blue-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>Controle Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Tenha visibilidade completa de suas receitas e despesas em tempo real.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardHeader>
                  <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Fácil de Usar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Interface intuitiva que torna o controle financeiro simples e rápido.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardHeader>
                  <div className="mx-auto bg-purple-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle>Sempre Atualizado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Seus dados sempre seguros e acessíveis de qualquer dispositivo.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Button
                size="lg"
                onClick={() => openAuthModal('register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Comece Agora Gratuitamente
              </Button>
              <div>
                <Button
                  variant="link"
                  onClick={() => openAuthModal('login')}
                  className="text-blue-600"
                >
                  Já tem uma conta? Faça login
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isTransactionModalOpen && (
        <TransactionModal
          onSave={handleTransactionAdded}
          onClose={() => setIsTransactionModalOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  )
}
