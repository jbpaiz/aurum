'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  X,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BankAccount } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  account: BankAccount | null
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

export function DeleteAccountModal({ isOpen, onClose, account }: DeleteAccountModalProps) {
  const { deleteAccount } = useAccounts()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!account) return

    setLoading(true)
    try {
      await deleteAccount(account.id)
      onClose()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderAccountIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Building2
    return <IconComponent className="h-5 w-5" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (!isOpen || !account) return null

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
                <CardTitle className="text-red-900">Deletar Conta</CardTitle>
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
                style={{ backgroundColor: account.color }}
              >
                {renderAccountIcon(account.icon)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{account.name}</div>
                <div className="text-sm text-gray-500">
                  {account.bank && `${account.bank} • `}
                  Saldo: {formatCurrency(account.balance)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Você está prestes a deletar a conta <strong>{account.name}</strong>.
            </p>
            
            {account.balance !== 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta conta possui saldo de {formatCurrency(account.balance)}. 
                  Certifique-se de transferir o valor para outra conta antes de deletar.
                </p>
              </div>
            )}

            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>Esta ação é irreversível!</strong> Todas as transações associadas 
                a esta conta serão mantidas, mas a conta não poderá ser restaurada.
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
              {loading ? 'Deletando...' : 'Deletar Conta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
