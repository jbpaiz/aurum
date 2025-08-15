'use client'

import { useState } from 'react'
import { 
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  ChevronDown,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentMethod } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface PaymentMethodSelectorProps {
  value?: string // ID da forma de pagamento selecionada
  onChange: (paymentMethodId: string, paymentMethod: PaymentMethod) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  onAccountBalanceUpdate?: (accountId: string, newBalance: number) => void
}

export function PaymentMethodSelector({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Selecione a forma de pagamento",
  className = "",
  onAccountBalanceUpdate
}: PaymentMethodSelectorProps) {
  const { paymentMethods, accounts, getAccountById } = useAccounts()
  const [isOpen, setIsOpen] = useState(false)

  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === value)
  const selectedAccount = selectedPaymentMethod ? getAccountById(selectedPaymentMethod.accountId) : null

  const renderPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'pix':
        return <Smartphone className="h-4 w-4" />
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />
      case 'bank_transfer':
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const handleSelect = (paymentMethod: PaymentMethod) => {
    onChange(paymentMethod.id, paymentMethod)
    setIsOpen(false)
  }

  const groupedPaymentMethods = paymentMethods.reduce((acc, pm) => {
    const account = getAccountById(pm.accountId)
    if (account) {
      if (!acc[account.name]) {
        acc[account.name] = []
      }
      acc[account.name].push(pm)
    }
    return acc
  }, {} as Record<string, PaymentMethod[]>)

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between h-auto p-3"
      >
        {selectedPaymentMethod ? (
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: selectedPaymentMethod.color }}
            >
              {renderPaymentMethodIcon(selectedPaymentMethod.type)}
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-sm">{selectedPaymentMethod.name}</div>
              <div className="text-xs text-gray-500">
                {selectedAccount?.name} • {selectedAccount ? formatCurrency(selectedAccount.balance) : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="shadow-lg">
            <CardContent className="p-2 max-h-64 overflow-y-auto">
              {Object.keys(groupedPaymentMethods).length > 0 ? (
                Object.entries(groupedPaymentMethods).map(([accountName, methods]) => {
                  const account = accounts.find(acc => acc.name === accountName)
                  return (
                    <div key={accountName} className="mb-2">
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded">
                        {accountName} • {account ? formatCurrency(account.balance) : 'N/A'}
                      </div>
                      {methods.map((paymentMethod) => (
                        <button
                          key={paymentMethod.id}
                          type="button"
                          onClick={() => handleSelect(paymentMethod)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded text-left"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: paymentMethod.color }}
                          >
                            {renderPaymentMethodIcon(paymentMethod.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{paymentMethod.name}</div>
                            <div className="text-xs text-gray-500">
                              {paymentMethod.type === 'pix' && 'PIX'}
                              {paymentMethod.type === 'cash' && 'Dinheiro'}
                              {paymentMethod.type === 'credit_card' && 'Cartão de Crédito'}
                              {paymentMethod.type === 'debit_card' && 'Cartão de Débito'}
                              {paymentMethod.type === 'bank_transfer' && 'Transferência Bancária'}
                            </div>
                          </div>
                          {value === paymentMethod.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma forma de pagamento cadastrada</p>
                  <p className="text-xs mt-1">Configure suas formas de pagamento primeiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
