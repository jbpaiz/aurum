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
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddCardModal } from '@/components/cards/add-card-modal'

export function CardsPage() {
  const [showNumbers, setShowNumbers] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dados simulados - substituir por dados reais
  const cards = [
    {
      id: '1',
      name: 'Cartão Nubank',
      brand: 'Mastercard',
      type: 'credit',
      lastDigits: '1234',
      limit: 5000,
      used: 1250,
      dueDate: '2024-01-15',
      status: 'active',
      color: '#8A05BE'
    },
    {
      id: '2', 
      name: 'Cartão Itaú',
      brand: 'Visa',
      type: 'credit',
      lastDigits: '5678',
      limit: 8000,
      used: 3200,
      dueDate: '2024-01-20',
      status: 'active',
      color: '#FF6B00'
    },
    {
      id: '3',
      name: 'Cartão Santander',
      brand: 'Mastercard', 
      type: 'debit',
      lastDigits: '9012',
      limit: 0,
      used: 0,
      dueDate: null,
      status: 'active',
      color: '#EC0000'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatCardNumber = (lastDigits: string) => {
    return showNumbers ? `**** **** **** ${lastDigits}` : '**** **** **** ****'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    const statuses: { [key: string]: string } = {
      'active': 'Ativo',
      'blocked': 'Bloqueado',
      'pending': 'Pendente'
    }
    return statuses[status] || status
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.round((used / limit) * 100)
  }

  const getTotalLimit = () => {
    return cards.filter(card => card.type === 'credit').reduce((total, card) => total + card.limit, 0)
  }

  const getTotalUsed = () => {
    return cards.filter(card => card.type === 'credit').reduce((total, card) => total + card.used, 0)
  }

  const getActiveCards = () => {
    return cards.filter(card => card.status === 'active').length
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
            {showNumbers ? 'Ocultar Números' : 'Mostrar Números'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
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
            <CardTitle className="text-sm font-medium text-gray-600">Valor Utilizado</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalUsed())}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round((getTotalUsed() / getTotalLimit()) * 100)}% do limite
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
              De {cards.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: card.color + '20', color: card.color }}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {card.brand} • {card.type === 'credit' ? 'Crédito' : 'Débito'}
                      {getStatusIcon(card.status)}
                      <span className="text-xs">{getStatusText(card.status)}</span>
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Card Number */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Número do Cartão</p>
                <p className="font-mono text-lg font-medium">
                  {formatCardNumber(card.lastDigits)}
                </p>
              </div>

              {/* Credit Card Info */}
              {card.type === 'credit' && (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Limite</p>
                      <p className="font-semibold">{formatCurrency(card.limit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Utilizado</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(card.used)}</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Uso do limite</span>
                      <span className="text-sm font-medium">{getUsagePercentage(card.used, card.limit)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          getUsagePercentage(card.used, card.limit) > 80
                            ? 'bg-red-500'
                            : getUsagePercentage(card.used, card.limit) > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${getUsagePercentage(card.used, card.limit)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Due Date */}
                  {card.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Vencimento: {new Date(card.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Eye className="h-4 w-4" />
                  Detalhes
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {isModalOpen && (
        <AddCardModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
