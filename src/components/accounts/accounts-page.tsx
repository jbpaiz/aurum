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
  MoreVertical,
  PiggyBank,
  Banknote,
  Target,
  Store,
  Home,
  Car,
  Briefcase,
  Smartphone,
  Coffee,
  ShoppingCart,
  ArrowRightLeft
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '@/contexts/accounts-context'
import { AccountModal } from './account-modal'
import { TransferModal } from '@/components/transfers/transfer-modal'
import { useToast } from '@/hooks/use-toast'
import { usePersistedModalState } from '@/hooks/use-persisted-modal'
import { DeleteAccountModal } from './delete-account-modal'
import { BankAccount, ACCOUNT_TYPES } from '@/types/accounts'

// Map dos ícones disponíveis
const ICON_MAP: { [key: string]: React.ComponentType<any> } = {
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
  Target,
  Store,
  Home,
  Car,
  Briefcase,
  Smartphone,
  Coffee,
  ShoppingCart
}

export function AccountsPage() {
  const { accounts, loading } = useAccounts()
  const [showBalances, setShowBalances] = useState(true)
  // Usar hook persistente para manter modal aberto ao trocar de aba
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = usePersistedModalState('account-modal')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { isOpen: isTransferModalOpen, open: openTransferModal, close: closeTransferModal } = usePersistedModalState('transfer-modal')
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const renderAccountIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Building2
    return <IconComponent className="h-5 w-5" />
  }

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0)
  }

  const getPositiveBalanceAccounts = () => {
    return accounts.filter(account => account.balance > 0).length
  }

  const getAccountsWithActivity = () => {
    // Simulando contas com atividade recente
    return Math.min(accounts.length - 1, accounts.length)
  }

  const handleAddAccount = () => {
    setSelectedAccount(null)
    setModalMode('add')
    openModal()
  }

  const handleEditAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setModalMode('edit')
    openModal()
  }

  const handleDeleteAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModal = () => {
    closeModal()
    setSelectedAccount(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedAccount(null)
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
          <p className="text-gray-600">Gerencie suas contas bancárias e carteiras</p>
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
          <Button
            variant="outline"
            onClick={openTransferModal}
            className="gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transferir
          </Button>
          <Button onClick={handleAddAccount} className="gap-2">
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
              {accounts.length}
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
            Visualize e gerencie todas as suas contas bancárias e carteiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-full text-white flex items-center justify-center"
                      style={{ backgroundColor: account.color }}
                    >
                      {renderAccountIcon(account.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{account.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {ACCOUNT_TYPES[account.type]?.label || account.type}
                        </Badge>
                        {account.bank && (
                          <span className="text-sm text-gray-500">
                            {account.bank}
                          </span>
                        )}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAccount(account)}
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
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma conta cadastrada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando sua primeira conta bancária ou carteira
              </p>
              <Button onClick={handleAddAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Conta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
        mode={modalMode}
      />

      <TransferModal
        open={isTransferModalOpen}
        onClose={closeTransferModal}
        onSuccess={() => {
          toast({
            title: 'Transferência realizada com sucesso!',
            variant: 'default'
          })
        }}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        account={selectedAccount}
      />
    </div>
  )
}

export default AccountsPage
