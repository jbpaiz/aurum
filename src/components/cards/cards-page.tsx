'use client'

import { useState } from 'react'
import { 
  Plus, 
  CreditCard, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  DollarSign,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddCardModal } from '@/components/cards/add-card-modal'
import { PayInvoiceModal } from '@/components/cards/pay-invoice-modal'
import { EditCardLimitModal } from '@/components/cards/edit-card-limit-modal'
import { useCards } from '@/contexts/cards-context'
import type { CreditCard as CreditCardType } from '@/types/cards'

export function CardsPage() {
  const { cards, providers, loading, deleteCard } = useCards()
  const [showNumbers, setShowNumbers] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<CreditCardType | null>(null)
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<CreditCardType | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatCardNumber = (lastDigits: string | undefined) => {
    if (!lastDigits) return '**** **** **** ****'
    return showNumbers ? `**** **** **** ${lastDigits}` : '**** **** **** ****'
  }

  const getProviderInfo = (providerId: string) => {
    return providers.find(p => p.id === providerId)
  }

  const getTotalLimit = () => {
    return cards
      .filter(card => card.type === 'credit' && card.creditLimit)
      .reduce((total, card) => total + (card.creditLimit || 0), 0)
  }

  const getTotalUsed = () => {
    return cards
      .filter(card => card.type === 'credit')
      .reduce((total, card) => total + (card.currentBalance || 0), 0)
  }

  const getActiveCards = () => {
    return cards.filter(card => card.isActive).length
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Deseja realmente excluir este cartão?')) return
    await deleteCard(cardId)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando cartões...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Cartões</h1>
          <p className="text-gray-600">Gerencie seus cartões de crédito e débito</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNumbers(!showNumbers)}
            className="gap-2"
          >
            {showNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showNumbers ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cartão
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Limite Total</CardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getTotalLimit())}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Cartões de crédito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fatura Total</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalUsed())}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {getTotalLimit() > 0 ? Math.round((getTotalUsed() / getTotalLimit()) * 100) : 0}% do limite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Limite Disponível</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getTotalLimit() - getTotalUsed())}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Disponível para uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cartões Ativos</CardTitle>
            <Shield className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getActiveCards()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Total cadastrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((card) => {
          const provider = getProviderInfo(card.providerId)
          const usagePercentage = card.creditLimit && card.creditLimit > 0
            ? Math.round(((card.currentBalance || 0) / card.creditLimit) * 100)
            : 0

          return (
            <Card key={card.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: provider?.color || '#6B7280' }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg text-2xl"
                      style={{ backgroundColor: (provider?.color || '#6B7280') + '20' }}
                    >
                      {provider?.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.alias}</CardTitle>
                      <CardDescription>
                        {provider?.name} • {card.type === 'credit' ? 'Crédito' : 'Débito'}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {card.type === 'credit' && (card.currentBalance || 0) > 0 && (
                        <DropdownMenuItem onClick={() => setSelectedCardForPayment(card)}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pagar Fatura
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setSelectedCardForEdit(card)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Editar Limite/Saldo
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Card Number */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Número do Cartão</p>
                  <p className="font-mono text-lg font-medium">
                    {formatCardNumber(card.lastFourDigits)}
                  </p>
                </div>

                {/* Credit Card Info */}
                {card.type === 'credit' && (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Limite</p>
                        <p className="font-semibold">
                          {card.creditLimit ? formatCurrency(card.creditLimit) : 'Não definido'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Fatura</p>
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(card.currentBalance || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Usage Bar */}
                    {card.creditLimit && card.creditLimit > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Uso do limite</span>
                          <span className="text-sm font-medium">{usagePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              usagePercentage > 80
                                ? 'bg-red-500'
                                : usagePercentage > 60
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    {card.dueDay && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Vencimento dia {card.dueDay}</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    {(card.currentBalance || 0) > 0 && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => setSelectedCardForPayment(card)}
                      >
                        <DollarSign className="h-4 w-4" />
                        Pagar Fatura - {formatCurrency(card.currentBalance || 0)}
                      </Button>
                    )}
                  </>
                )}

                {card.type === 'debit' && (
                  <p className="text-sm text-gray-500 italic">
                    Cartão de débito vinculado à conta
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece adicionando seu primeiro cartão de crédito ou débito
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddCardModal onClose={() => setIsAddModalOpen(false)} />
      )}
      
      {selectedCardForPayment && (
        <PayInvoiceModal
          open={true}
          onClose={() => setSelectedCardForPayment(null)}
          card={selectedCardForPayment}
        />
      )}

      {selectedCardForEdit && (
        <EditCardLimitModal
          open={true}
          onClose={() => setSelectedCardForEdit(null)}
          card={selectedCardForEdit}
        />
      )}
    </div>
  )
}
