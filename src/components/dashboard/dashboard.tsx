'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Wallet,
  PieChart,
  Calendar,
  Eye,
  EyeOff,
  Plus,
  ArrowRightLeft
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { TransactionModal, TransactionFormValues } from '@/components/modals/transaction-modal'
import { useTransactions } from '@/hooks/use-transactions'
import { useToast } from '@/hooks/use-toast'

export function Dashboard() {
  const { data, loading, refresh } = useDashboardData()
  const { addTransaction, updateTransaction } = useTransactions()
  const { toast } = useToast()
  const [showBalance, setShowBalance] = useState(true)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormValues | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  const savings = data.monthlyIncome - data.monthlyExpenses

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo de volta! Aqui está um resumo das suas finanças.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTransactionModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo Total */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-8 w-8 p-0"
              >
                {showBalance ? (
                  <Eye className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {showBalance ? formatCurrency(data.balance) : '••••••'}
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Total em todas as contas
            </p>
          </CardContent>
        </Card>

        {/* Receitas do Mês */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receitas do Mês</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showBalance ? formatCurrency(data.monthlyIncome) : '••••••'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        {/* Despesas do Mês */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas do Mês</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {showBalance ? formatCurrency(data.monthlyExpenses) : '••••••'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        {/* Economia do Mês */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Economia do Mês</CardTitle>
            <PieChart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${savings >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {showBalance ? formatCurrency(savings) : '••••••'}
            </div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${savings >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {savings >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {data.monthlyIncome > 0 ? Math.round((Math.abs(savings) / data.monthlyIncome) * 100) : 0}% da renda
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Despesas por Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição dos seus gastos no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryExpenses.length > 0 ? (
              <div className="space-y-4">
                {data.categoryExpenses.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${category.percentage}%`,
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma despesa encontrada este mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo das Contas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Suas Contas
            </CardTitle>
            <CardDescription>
              Saldo atual em cada conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.accounts.length > 0 ? (
              <div className="space-y-4">
                {data.accounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{account.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {showBalance ? formatCurrency(account.balance) : '••••'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta cadastrada</p>
                <Button size="sm" className="mt-2">
                  Adicionar Conta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Transações Recentes
              </CardTitle>
              <CardDescription>
                Suas últimas movimentações financeiras
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <p className="font-semibold">
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
              <Button size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          isSaving={isSaving}
          onSave={async (transaction) => {
            try {
              setIsSaving(true)
              
              if ('id' in transaction && transaction.id) {
                await updateTransaction(transaction.id, transaction as TransactionFormValues)
                toast({
                  title: 'Transação atualizada!',
                  description: 'A transação foi atualizada com sucesso.'
                })
              } else {
                await addTransaction(transaction)
                toast({
                  title: 'Transação adicionada!',
                  description: 'A nova transação foi criada com sucesso.'
                })
              }
              
              // Atualizar dados do dashboard
              refresh()
              
              setEditingTransaction(null)
              setIsTransactionModalOpen(false)
            } catch (error) {
              console.error('Erro ao salvar transação:', error)
              toast({
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar a transação. Tente novamente.',
                variant: 'destructive'
              })
            } finally {
              setIsSaving(false)
            }
          }}
          onClose={() => {
            setEditingTransaction(null)
            setIsTransactionModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
