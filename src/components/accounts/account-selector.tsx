'use client'

import { useState } from 'react'
import { 
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
  ShoppingCart,
  ChevronDown,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BankAccount } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface AccountSelectorProps {
  value?: string // ID da conta selecionada
  onChange: (accountId: string, account: BankAccount) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludeAccountId?: string // Para transferências, excluir a conta de origem
}

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

export function AccountSelector({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Selecione a conta",
  className = "",
  excludeAccountId
}: AccountSelectorProps) {
  const { accounts } = useAccounts()
  const [isOpen, setIsOpen] = useState(false)

  const availableAccounts = excludeAccountId 
    ? accounts.filter(acc => acc.id !== excludeAccountId)
    : accounts

  const selectedAccount = accounts.find(acc => acc.id === value)

  const renderAccountIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Building2
    return <IconComponent className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const handleSelect = (account: BankAccount) => {
    onChange(account.id, account)
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
        {selectedAccount ? (
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: selectedAccount.color }}
            >
              {renderAccountIcon(selectedAccount.icon)}
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-sm">{selectedAccount.name}</div>
              <div className="text-xs text-gray-500">
                {selectedAccount.bank || 'Carteira'} • {formatCurrency(selectedAccount.balance)}
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
              {availableAccounts.length > 0 ? (
                availableAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleSelect(account)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: account.color }}
                    >
                      {renderAccountIcon(account.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-gray-500">
                        {account.bank || 'Carteira'} • {formatCurrency(account.balance)}
                      </div>
                    </div>
                    {value === account.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conta disponível</p>
                  <p className="text-xs mt-1">Cadastre suas contas primeiro</p>
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
