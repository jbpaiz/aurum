'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentMethod, PAYMENT_METHOD_TYPES } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface DeletePaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  paymentMethod: PaymentMethod | null
}

export function DeletePaymentMethodModal({ isOpen, onClose, paymentMethod }: DeletePaymentMethodModalProps) {
  const { deletePaymentMethod, accounts } = useAccounts()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!paymentMethod) return

    setLoading(true)
    try {
      await deletePaymentMethod(paymentMethod.id)
      onClose()
    } catch (error) {
      console.error('Erro ao deletar forma de pagamento:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!isOpen || !paymentMethod) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-900">Deletar Forma de Pagamento</CardTitle>
                <CardDescription>
                  Esta ação não pode ser desfeita
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: paymentMethod.color }}
              >
                {renderPaymentMethodIcon(paymentMethod.type)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{paymentMethod.name}</div>
                <div className="text-sm text-gray-500">
                  {PAYMENT_METHOD_TYPES[paymentMethod.type]?.label} • {getAccountName(paymentMethod.accountId)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Você está prestes a deletar a forma de pagamento <strong>{paymentMethod.name}</strong>.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>Esta ação é irreversível!</strong> Todas as transações que utilizaram 
                esta forma de pagamento serão mantidas, mas a forma de pagamento não poderá ser restaurada.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Deletando...' : 'Deletar Forma de Pagamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
