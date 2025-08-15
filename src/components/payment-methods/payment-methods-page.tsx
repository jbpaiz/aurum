'use client'

import { useState } from 'react'
import { 
  Plus, 
  CreditCard, 
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Link
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '@/contexts/accounts-context'
import { PaymentMethodModal } from './payment-method-modal'
import { DeletePaymentMethodModal } from './delete-payment-method-modal'
import { PaymentMethod, PAYMENT_METHOD_TYPES } from '@/types/accounts'

// Map dos ícones disponíveis
const PAYMENT_ICON_MAP: { [key: string]: React.ComponentType<any> } = {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft
}

export function PaymentMethodsPage() {
  const { paymentMethods, accounts, loading } = useAccounts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')

  const renderPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'pix':
        return <Smartphone className="h-5 w-5" />
      case 'cash':
        return <Banknote className="h-5 w-5" />
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5" />
      case 'bank_transfer':
        return <ArrowRightLeft className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    return account?.name || 'Conta não encontrada'
  }

  const getAccountColor = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    return account?.color || '#6B7280'
  }

  const handleAddPaymentMethod = () => {
    setSelectedPaymentMethod(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeletePaymentMethod = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod)
    setIsDeleteModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPaymentMethod(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedPaymentMethod(null)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando formas de pagamento...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Formas de Pagamento</h1>
          <p className="text-gray-600">Configure suas formas de pagamento vinculadas às contas</p>
        </div>
        <Button onClick={handleAddPaymentMethod} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Forma de Pagamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Métodos</CardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {paymentMethods.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Formas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">PIX</CardTitle>
            <Smartphone className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentMethods.filter(pm => pm.type === 'pix').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Chaves PIX
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cartões</CardTitle>
            <CreditCard className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {paymentMethods.filter(pm => pm.type === 'credit_card' || pm.type === 'debit_card').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Crédito e débito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dinheiro</CardTitle>
            <Banknote className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentMethods.filter(pm => pm.type === 'cash').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Pagamentos em espécie
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Formas de Pagamento</CardTitle>
          <CardDescription>
            Gerencie as formas de pagamento vinculadas às suas contas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-full text-white flex items-center justify-center"
                      style={{ backgroundColor: paymentMethod.color }}
                    >
                      {renderPaymentMethodIcon(paymentMethod.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{paymentMethod.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {PAYMENT_METHOD_TYPES[paymentMethod.type]?.label || paymentMethod.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Link className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {getAccountName(paymentMethod.accountId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getAccountColor(paymentMethod.accountId) }}
                      title={`Vinculado à conta: ${getAccountName(paymentMethod.accountId)}`}
                    />
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditPaymentMethod(paymentMethod)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeletePaymentMethod(paymentMethod)}
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
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma forma de pagamento cadastrada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando sua primeira forma de pagamento vinculada a uma conta
              </p>
              <Button onClick={handleAddPaymentMethod} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Forma de Pagamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={closeModal}
        paymentMethod={selectedPaymentMethod}
        mode={modalMode}
      />

      <DeletePaymentMethodModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        paymentMethod={selectedPaymentMethod}
      />
    </div>
  )
}
