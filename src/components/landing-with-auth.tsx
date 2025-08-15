'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CalendarDays,
  UserPlus,
  LogIn
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TransactionModal } from '@/components/modals/transaction-modal'
import { TransactionList } from '@/components/transactions/transaction-list'
import { AuthModal } from '@/components/auth/auth-modal'
import { UserMenu } from '@/components/auth/user-menu'
import { CardsManagement } from '@/components/cards/cards-management'
import { AccountsManagement } from '@/components/accounts/accounts-management'
import { useAuth } from '@/contexts/auth-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  paymentMethodId?: string
  installments?: number
}

export default function LandingWithAuth() {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'income',
      description: 'Salário',
      amount: 5000,
      category: 'Trabalho',
      date: '2024-01-15'
    },
    {
      id: '2',
      type: 'expense',
      description: 'Supermercado',
      amount: 250,
      category: 'Alimentação',
      date: '2024-01-14'
    },
    {
      id: '3',
      type: 'expense',
      description: 'Gasolina',
      amount: 180,
      category: 'Transporte',
      date: '2024-01-13'
    }
  ])
  
  const [showBalance, setShowBalance] = useState(true)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    }
    setTransactions(prev => [newTransaction, ...prev])
    setIsTransactionModalOpen(false)
  }

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    )
    setEditingTransaction(null)
    setIsTransactionModalOpen(false)
  }

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const handleSaveTransaction = (transactionData: Transaction | Omit<Transaction, 'id'>) => {
    if ('id' in transactionData) {
      // É uma edição
      updateTransaction(transactionData as Transaction)
    } else {
      // É uma nova transação
      addTransaction(transactionData)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsTransactionModalOpen(true)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Aurum</h1>
                <p className="text-xs text-muted-foreground">Controle Financeiro</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button 
                    onClick={() => setIsTransactionModalOpen(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nova Transação
                  </Button>
                  <UserMenu />
                </>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Criar Conta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!user ? (
          /* Welcome Section for Non-Authenticated Users */
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Bem-vindo ao Aurum
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Seu assistente pessoal para controle financeiro. 
                Gerencie receitas, despesas e acompanhe seu progresso financeiro.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center">
                  <CardHeader>
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <CardTitle className="text-lg">Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Registre e acompanhe todas suas fontes de renda
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <CardTitle className="text-lg">Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Controle seus gastos por categoria e período
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <CalendarDays className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <CardTitle className="text-lg">Relatórios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Visualize relatórios detalhados de suas finanças
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Criar Conta Grátis
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  Já tenho conta
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard for Authenticated Users */
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {showBalance ? formatCurrency(balance) : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {showBalance ? formatCurrency(totalIncome) : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transactions.filter(t => t.type === 'income').length} transação(ões)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {showBalance ? formatCurrency(totalExpenses) : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transactions.filter(t => t.type === 'expense').length} transação(ões)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>
                      Suas últimas movimentações financeiras
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionList 
                  transactions={transactions}
                  onEdit={handleEditTransaction}
                  onDelete={deleteTransaction}
                  showBalance={showBalance}
                />
              </CardContent>
            </Card>

            {/* Accounts Management Section */}
            <AccountsManagement />

            {/* Cards Management Section */}
            <CardsManagement />
          </>
        )}
      </main>

      {/* Modals */}
      {isTransactionModalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => {
            setIsTransactionModalOpen(false)
            setEditingTransaction(null)
          }}
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
