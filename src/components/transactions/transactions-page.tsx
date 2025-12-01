'use client'

import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  ArrowRightLeft
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TransactionModal, TransactionFormValues } from '@/components/modals/transaction-modal'
import { TransferModal } from '@/components/transfers/transfer-modal'
import { useTransactions, TransactionRecord, type TransactionFormData } from '@/hooks/use-transactions'
import { useToast } from '@/hooks/use-toast'
import { usePersistedModalState } from '@/hooks/use-persisted-modal'

export function TransactionsPage() {
  const { toast } = useToast()
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isSaving
  } = useTransactions()
  // Usar hooks persistentes para manter modais abertos ao trocar de aba
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = usePersistedModalState('transaction-modal')
  const { isOpen: isTransferModalOpen, open: openTransferModal, close: closeTransferModal } = usePersistedModalState('transaction-transfer-modal')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormValues | null>(null)

  const currentMonthKey = new Date().toISOString().slice(0, 7)

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.type !== 'transfer' && transaction.date.slice(0, 7) === currentMonthKey
      ),
    [transactions, currentMonthKey]
  )

  const totalIncome = useMemo(
    () => monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions]
  )

  const totalExpenses = useMemo(
    () => monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions]
  )

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return transactions.filter(transaction => {
      if (transaction.type === 'transfer') {
        return false
      }
      const matchesSearch = normalizedSearch === ''
        || transaction.description.toLowerCase().includes(normalizedSearch)
        || transaction.category.toLowerCase().includes(normalizedSearch)
      const matchesType = filterType === 'all' || transaction.type === filterType
      return matchesSearch && matchesType
    })
  }, [filterType, searchTerm, transactions])

  const handleSaveTransaction = async (transactionData: TransactionFormValues | Omit<TransactionFormValues, 'id'>) => {
    try {
      if (!transactionData.accountId) {
        toast({
          title: 'Selecione uma conta',
          description: 'Escolha uma conta antes de salvar a transação.',
          variant: 'destructive'
        })
        return
      }

      const payload: TransactionFormData = {
        type: transactionData.type,
        description: transactionData.description,
        amount: transactionData.amount,
        category: transactionData.category,
        date: transactionData.date,
        accountId: transactionData.accountId,
        paymentMethod: transactionData.paymentMethod,
        installments: transactionData.installments
      }

      if ('id' in transactionData && transactionData.id) {
        await updateTransaction(transactionData.id, payload)
        toast({ title: 'Transação atualizada' })
      } else {
        await addTransaction(payload)
        toast({ title: 'Transação registrada!' })
      }

      setIsModalOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Não foi possível salvar a transação'
      toast({ title: 'Erro', description, variant: 'destructive' })
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id)
      toast({ title: 'Transação removida' })
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Não foi possível remover a transação'
      toast({ title: 'Erro', description, variant: 'destructive' })
    }
  }

  const handleEditTransaction = (transaction: TransactionRecord) => {
    if (transaction.type === 'transfer') {
      toast({
        title: 'Não suportado',
        description: 'Use o modal unificado para editar transferências.',
        variant: 'destructive'
      })
      return
    }

    const modalData: TransactionFormValues = {
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      accountId: transaction.accountId || '',
      paymentMethod: transaction.paymentMethod,
      installments: transaction.installments
    }

    setEditingTransaction(modalData)
    setIsModalOpen(true)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount))

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Gerencie todas as suas movimentações financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openTransferModal}
            variant="outline"
            className="gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferência
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null)
              openModal()
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
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
                <Button onClick={openModal} className="gap-2">
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
          transaction={editingTransaction}
          isSaving={isSaving}
          onSave={handleSaveTransaction}
          onClose={() => {
            setEditingTransaction(null)
            closeModal()
          }}
        />
      )}

      {/* Modal de Transferência */}
      {isTransferModalOpen && (
        <TransferModal
          open={isTransferModalOpen}
          onClose={closeTransferModal}
          onSuccess={() => {
            toast({
              title: 'Transferência realizada!',
              description: 'A transferência entre contas foi concluída.'
            })
          }}
        />
      )}
    </div>
  )
}
