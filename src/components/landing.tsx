'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react'
import { TransactionForm } from './transaction-form'
import { TransactionList } from './transaction-list'
import { SupabaseConfig } from './supabase-config'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_at: string
}

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
import { useAuth } from '@/contexts/auth-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
}

export default function Landing() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      // Se não há configuração válida do Supabase, use dados mock
      if (supabaseUrl === 'https://demo.supabase.co') {
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            type: 'income',
            amount: 5000,
            description: 'Salário do mês',
            category: 'Salário',
            date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            type: 'expense',
            amount: 800,
            description: 'Compras no supermercado',
            category: 'Alimentação',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            type: 'expense',
            amount: 1200,
            description: 'Aluguel',
            category: 'Moradia',
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }
        ]
        setTransactions(mockTransactions)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Erro ao carregar transações:', error)
        setError('Erro ao carregar transações. Usando dados de demonstração.')
        // Use dados mock em caso de erro
        setTransactions([])
      } else {
        setTransactions(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      setError('Erro de conexão. Usando dados de demonstração.')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      // Se estiver em modo demo, adicione localmente
      if (supabaseUrl === 'https://demo.supabase.co') {
        const newTransaction: Transaction = {
          ...transaction,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        }
        setTransactions(prev => [newTransaction, ...prev])
        setIsFormOpen(false)
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: '1' // Temporário - em um app real, viria da autenticação
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao adicionar transação:', error)
        // Em caso de erro, adicione localmente como fallback
        const newTransaction: Transaction = {
          ...transaction,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        }
        setTransactions(prev => [newTransaction, ...prev])
      } else {
        setTransactions(prev => [data, ...prev])
      }
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar transação:', error)
      // Em caso de erro, adicione localmente como fallback
      const newTransaction: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }
      setTransactions(prev => [newTransaction, ...prev])
      setIsFormOpen(false)
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Aurum</h1>
              {supabaseUrl === 'https://demo.supabase.co' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Modo Demo
                </span>
              )}
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">Controle Financeiro Inteligente</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie suas receitas e despesas de forma simples e eficiente. 
              Tenha controle total sobre suas finanças.
            </p>
            {supabaseUrl === 'https://demo.supabase.co' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-blue-700">
                  <strong>Modo Demonstração:</strong> Para usar com dados reais, configure as credenciais do Supabase no arquivo .env.local
                </p>
              </div>
            )}
          </div>

          {/* Supabase Configuration Card */}
          <div className="max-w-2xl mx-auto mb-8">
            <SupabaseConfig isConfigured={supabaseUrl !== 'https://demo.supabase.co'} />
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toFixed(2).replace('.', ',')}
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
                  R$ {totalIncome.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions.filter(t => t.type === 'income').length} transações
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
                  R$ {totalExpenses.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions.filter(t => t.type === 'expense').length} transações
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transactions Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">Transações Recentes</h3>
              <p className="text-muted-foreground">Acompanhe suas últimas movimentações</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Período
              </Button>
            </div>
          </div>

          <TransactionList transactions={transactions} />
        </div>
      </section>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <TransactionForm
          onSubmit={addTransaction}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}
