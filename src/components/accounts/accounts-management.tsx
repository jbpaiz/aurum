'use client'

import { useState } from 'react'
import { 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  TrendingUp,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccounts } from '@/contexts/accounts-context'
import { ACCOUNT_TYPES } from '@/types/accounts'

export function AccountsManagement() {
  const { accounts, paymentMethods, getPaymentMethodsByAccount, loading } = useAccounts()
  const [showBalances, setShowBalances] = useState(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Minhas Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Minhas Contas
            </CardTitle>
            <CardDescription>
              Gerencie suas contas bancárias e métodos de pagamento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Resumo Total */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-bold text-primary">
                {showBalances ? formatCurrency(getTotalBalance()) : '••••••'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">
                {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione suas contas para ter melhor controle financeiro
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Primeira Conta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const accountPaymentMethods = getPaymentMethodsByAccount(account.id)
              const accountType = ACCOUNT_TYPES[account.type]
              
              return (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ 
                    borderColor: account.color + '20',
                    backgroundColor: account.color + '05'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: account.color + '20' }}
                      >
                        {account.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              borderColor: account.color,
                              color: account.color 
                            }}
                          >
                            {accountType.icon} {accountType.label}
                          </Badge>
                          {account.bank && (
                            <Badge variant="secondary" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {account.bank}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold" style={{ color: account.color }}>
                          {showBalances ? formatCurrency(account.balance) : '••••••'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {accountPaymentMethods.length} método{accountPaymentMethods.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Métodos de Pagamento */}
                  {accountPaymentMethods.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Métodos de Pagamento:</p>
                      <div className="flex flex-wrap gap-1">
                        {accountPaymentMethods.map((method) => (
                          <Badge
                            key={method.id}
                            variant="outline"
                            className="text-xs"
                            style={{ 
                              borderColor: method.color + '40',
                              backgroundColor: method.color + '10',
                              color: method.color
                            }}
                          >
                            {method.icon} {method.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
