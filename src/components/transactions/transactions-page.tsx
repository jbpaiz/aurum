'use client'

import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Edit,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TransactionModal } from '@/components/modals/transaction-modal'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

export function TransactionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data, loading } = useDashboardData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveTransaction = async (transactionData: any) => {
    console.log('🔍 Iniciando salvamento de transação:', transactionData)
    console.log('👤 Usuário atual:', user)
    
    if (!user) {
      console.error('❌ Usuário não está logado')
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar transações",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    
    try {
      console.log('📋 Buscando contas do usuário...')
      
      // Buscar a primeira conta ativa do usuário como padrão
      const { data: userAccounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      console.log('🏦 Contas encontradas:', userAccounts)
      console.log('⚠️ Erro nas contas:', accountsError)

      if (accountsError) {
        throw new Error(`Erro ao buscar contas: ${accountsError.message}`)
      }

      if (!userAccounts || userAccounts.length === 0) {
        console.error('❌ Nenhuma conta ativa encontrada')
        toast({
          title: "Erro",
          description: "Você precisa ter pelo menos uma conta cadastrada para criar transações",
          variant: "destructive"
        })
        setIsSaving(false)
        return
      }

      const defaultAccountId = userAccounts[0].id
      console.log('🎯 Conta padrão selecionada:', defaultAccountId)

      // Buscar categoria pelo nome ou criar uma nova
      let categoryId = null
      if (transactionData.category) {
        console.log('🏷️ Buscando categoria:', transactionData.category)
        
        const { data: existingCategory, error: categorySearchError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', transactionData.category)
          .eq('user_id', user.id)
          .single()

        console.log('📂 Categoria existente:', existingCategory)
        console.log('⚠️ Erro na busca da categoria:', categorySearchError)

        if (existingCategory) {
          categoryId = existingCategory.id
          console.log('✅ Categoria encontrada:', categoryId)
        } else {
          console.log('🆕 Criando nova categoria...')
          // Criar nova categoria
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              name: transactionData.category,
              user_id: user.id,
              type: transactionData.type === 'income' ? 'income' : 'expense'
            })
            .select('id')
            .single()

          console.log('📝 Nova categoria criada:', newCategory)
          console.log('⚠️ Erro na criação da categoria:', categoryError)

          if (categoryError) throw new Error(`Erro ao criar categoria: ${categoryError.message}`)
          categoryId = newCategory.id
          console.log('✅ Nova categoria ID:', categoryId)
        }
      }

      // Preparar dados da transação
      const transactionInsert = {
        user_id: user.id,
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        transaction_date: transactionData.date,
        account_id: defaultAccountId,
        category_id: categoryId,
        payment_method_id: transactionData.paymentMethodId || null,
        installments: transactionData.installments || 1,
        current_installment: 1,
        is_installment: (transactionData.installments || 1) > 1,
        is_confirmed: true
      }

      console.log('💾 Dados para inserção:', transactionInsert)

      // Salvar transação
      const { data: savedTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionInsert)
        .select()

      console.log('💰 Transação salva:', savedTransaction)
      console.log('⚠️ Erro na transação:', transactionError)

      if (transactionError) throw new Error(`Erro ao salvar transação: ${transactionError.message}`)

      console.log('🎉 Transação salva com sucesso!')
      toast({
        title: "Sucesso!",
        description: "Transação salva com sucesso",
      })

      setIsModalOpen(false)
      
      // Recarregar a página para atualizar os dados
      window.location.reload()
      
    } catch (error) {
      console.error('💥 Erro completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: "Erro",
        description: `Não foi possível salvar a transação: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando transações...</p>
          </div>
        </div>
      </div>
    )
  }

  // Filtrar transações baseado na busca e filtro
  const filteredTransactions = data?.recentTransactions?.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesType
  }) || []

  const totalIncome = data?.monthlyIncome || 0
  const totalExpenses = data?.monthlyExpenses || 0

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Gerencie todas as suas movimentações financeiras</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Receitas</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Despesas</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo do Mês</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Resultado mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Lista de Transações</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as suas transações
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterType === 'income' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('income')}
                  className="text-green-600"
                >
                  Receitas
                </Button>
                <Button
                  variant={filterType === 'expense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('expense')}
                  className="text-red-600"
                >
                  Despesas
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {transaction.category}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <p className="font-semibold text-lg">
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' ? 'Nenhuma transação encontrada' : 'Nenhuma transação cadastrada'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Comece adicionando sua primeira transação'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeira Transação
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Transação */}
      {isModalOpen && (
        <TransactionModal
          onSave={handleSaveTransaction}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
