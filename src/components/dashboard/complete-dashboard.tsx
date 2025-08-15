'use client'

import { useState, useMemo } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  CreditCard,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/use-dashboard-data'

export function CompleteDashboard() {
  const { data, loading } = useDashboardData()
  const [showValues, setShowValues] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30') // dias

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Cálculos e análises
  const analytics = useMemo(() => {
    if (!data) return null

    const totalBalance = data.accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0
    const monthlyIncome = data.monthlyIncome || 0
    const monthlyExpenses = data.monthlyExpenses || 0
    const netIncome = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? ((netIncome / monthlyIncome) * 100) : 0

    // Simulação de dados históricos para gráficos
    const monthlyTrends = [
      { month: 'Jan', income: monthlyIncome * 0.9, expenses: monthlyExpenses * 0.8 },
      { month: 'Fev', income: monthlyIncome * 0.95, expenses: monthlyExpenses * 0.85 },
      { month: 'Mar', income: monthlyIncome * 1.1, expenses: monthlyExpenses * 0.9 },
      { month: 'Abr', income: monthlyIncome * 1.05, expenses: monthlyExpenses * 0.95 },
      { month: 'Mai', income: monthlyIncome * 1.2, expenses: monthlyExpenses * 1.1 },
      { month: 'Jun', income: monthlyIncome, expenses: monthlyExpenses }
    ]

    // Análise por categorias
    const topCategories = data.categoryExpenses?.slice(0, 5) || []
    
    // Tendências
    const incomeGrowth = 12.5 // Simulado
    const expenseGrowth = 8.3 // Simulado
    
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      savingsRate,
      monthlyTrends,
      topCategories,
      incomeGrowth,
      expenseGrowth
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600">Visão completa das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowValues(!showValues)}
            className="gap-2"
          >
            {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showValues ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards principais de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Patrimônio Total</CardTitle>
            <Wallet className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {showValues ? formatCurrency(analytics?.totalBalance || 0) : '••••••'}
            </div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+5.2% no mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receitas do Mês</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showValues ? formatCurrency(analytics?.monthlyIncome || 0) : '••••••'}
            </div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">{formatPercentage(analytics?.incomeGrowth || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas do Mês</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {showValues ? formatCurrency(analytics?.monthlyExpenses || 0) : '••••••'}
            </div>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-xs text-red-600">{formatPercentage(analytics?.expenseGrowth || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resultado do Mês</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (analytics?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {showValues ? formatCurrency(analytics?.netIncome || 0) : '••••••'}
            </div>
            <div className="flex items-center mt-1">
              <Target className="h-3 w-3 text-purple-600 mr-1" />
              <span className="text-xs text-purple-600">
                Taxa poupança: {analytics?.savingsRate.toFixed(1) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendência Mensal
            </CardTitle>
            <CardDescription>Receitas vs Despesas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.monthlyTrends.map((trend, index) => (
                <div key={trend.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{trend.month}</span>
                    <div className="flex gap-4">
                      <span className="text-green-600">
                        {showValues ? formatCurrency(trend.income) : '••••'}
                      </span>
                      <span className="text-red-600">
                        {showValues ? formatCurrency(trend.expenses) : '••••'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div 
                      className="bg-green-500 rounded"
                      style={{ 
                        width: `${(trend.income / (analytics?.monthlyIncome || 1)) * 50}%`,
                        minWidth: '2px'
                      }}
                    ></div>
                    <div 
                      className="bg-red-500 rounded"
                      style={{ 
                        width: `${(trend.expenses / (analytics?.monthlyExpenses || 1)) * 50}%`,
                        minWidth: '2px'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs text-gray-500 pt-2">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  Receitas
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  Despesas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>Top 5 categorias que mais consomem seu orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                      }}
                    ></div>
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {showValues ? formatCurrency(category.amount) : '••••'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
              {analytics?.topCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma despesa categorizada ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de contas e cartões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo de contas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Resumo de Contas
            </CardTitle>
            <CardDescription>Saldos das suas contas bancárias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.accounts?.slice(0, 4).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    ></div>
                    <div>
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.bank}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {showValues ? formatCurrency(account.balance) : '••••••'}
                  </div>
                </div>
              ))}
              {(!data?.accounts || data.accounts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conta cadastrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metas e objetivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Financeiras
            </CardTitle>
            <CardDescription>Acompanhe o progresso dos seus objetivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Meta de poupança */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Meta de Poupança</span>
                  <span className="text-sm text-gray-500">20% da renda</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((analytics?.savingsRate || 0), 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Atual: {analytics?.savingsRate.toFixed(1) || 0}%
                </div>
              </div>

              {/* Meta de gastos */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Controle de Gastos</span>
                  <span className="text-sm text-gray-500">80% da renda</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      ((analytics?.monthlyExpenses || 0) / (analytics?.monthlyIncome || 1)) > 0.8 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(((analytics?.monthlyExpenses || 0) / (analytics?.monthlyIncome || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Atual: {(((analytics?.monthlyExpenses || 0) / (analytics?.monthlyIncome || 1)) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Meta de emergência */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reserva de Emergência</span>
                  <span className="text-sm text-gray-500">6x gastos mensais</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(((analytics?.totalBalance || 0) / ((analytics?.monthlyExpenses || 0) * 6)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Atual: {((analytics?.totalBalance || 0) / ((analytics?.monthlyExpenses || 1) * 6)).toFixed(1)}x
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Últimas Transações
          </CardTitle>
          <CardDescription>Movimentações mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.recentTransactions?.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border-l-4 border-l-gray-200 bg-gray-50 rounded-r-lg">
                <div className="flex items-center gap-3">
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
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {showValues ? formatCurrency(transaction.amount) : '••••'}
                </div>
              </div>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma transação encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
