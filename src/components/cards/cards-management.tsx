'use client'

import { useState } from 'react'
import { 
  CreditCard as CreditCardIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCards } from '@/contexts/cards-context'
import { AddCardModal } from './add-card-modal'

export function CardsManagement() {
  const { cards, providers, loading, deleteCard, getProviderById } = useCards()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showCardNumbers, setShowCardNumbers] = useState(false)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Meus Cartões
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
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <CreditCardIcon className="h-5 w-5" />
              Meus Cartões
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Gerencie seus cartões de crédito e débito
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCardNumbers(!showCardNumbers)}
            >
              {showCardNumbers ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Cartão
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione seus cartões para ter melhor controle das despesas
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Primeiro Cartão
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const provider = getProviderById(card.providerId)
              return (
                <div
                  key={card.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-shadow"
                  style={{ 
                    borderColor: provider?.color + '20',
                    backgroundColor: provider?.color + '05'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{provider?.icon}</span>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: provider?.color,
                          color: provider?.color 
                        }}
                      >
                        {provider?.name}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => deleteCard(card.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm dark:text-white">{card.alias}</h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className="text-xs"
                        style={{ 
                          borderColor: card.type === 'credit' ? '#10B981' : '#3B82F6',
                          color: card.type === 'credit' ? '#10B981' : '#3B82F6'
                        }}
                      >
                        {card.type === 'credit' ? '💳 Crédito' : '🏧 Débito'}
                      </Badge>
                      <Badge 
                        variant={card.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {card.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {card.lastFourDigits && (
                      <p className="text-xs text-muted-foreground font-mono">
                        •••• •••• •••• {showCardNumbers ? card.lastFourDigits : '••••'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {isAddModalOpen && (
        <AddCardModal
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </Card>
  )
}
