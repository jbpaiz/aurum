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
import { PAYMENT_METHOD_TYPES } from '@/types/accounts'

interface SimplePaymentMethodSelectorProps {
  value?: string
  onChange: (methodType: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const PAYMENT_METHODS = [
  { type: 'pix', label: 'PIX', icon: Smartphone, color: '#21C25E' },
  { type: 'cash', label: 'Dinheiro', icon: Banknote, color: '#10B981' },
  { type: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, color: '#8A05BE' },
  { type: 'debit_card', label: 'Cartão de Débito', icon: CreditCard, color: '#3B82F6' },
  { type: 'bank_transfer', label: 'Transferência Bancária', icon: ArrowRightLeft, color: '#EC7000' },
  { type: 'other', label: 'Outros', icon: CreditCard, color: '#6B7280' }
]

export function SimplePaymentMethodSelector({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Como foi pago?",
  className = ""
}: SimplePaymentMethodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedMethod = PAYMENT_METHODS.find(method => method.type === value)

  const handleSelect = (methodType: string) => {
    onChange(methodType)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between h-auto p-3"
      >
        {selectedMethod ? (
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: selectedMethod.color }}
            >
              <selectedMethod.icon className="h-4 w-4" />
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-sm">{selectedMethod.label}</div>
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
            <CardContent className="p-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.type}
                  type="button"
                  onClick={() => handleSelect(method.type)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded text-left"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: method.color }}
                  >
                    <method.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{method.label}</div>
                  </div>
                  {value === method.type && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
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
