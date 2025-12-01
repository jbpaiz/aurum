'use client'

import { CreditCard, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCards } from '@/contexts/cards-context'

interface CardSelectorProps {
  value?: string
  onChange: (cardId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function CardSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um cartão",
  className = ""
}: CardSelectorProps) {
  const { cards, providers } = useCards()
  const [isOpen, setIsOpen] = useState(false)

  const selectedCard = cards.find(card => card.id === value)
  const selectedProvider = selectedCard ? providers.find(p => p.id === selectedCard.providerId) : null
  const creditCards = cards.filter(card => card.type === 'credit')

  const handleSelect = (cardId: string) => {
    onChange(cardId)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || creditCards.length === 0}
        className="w-full justify-between h-auto p-3"
      >
        {selectedCard ? (
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: selectedProvider?.color || '#8A05BE' }}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-sm">{selectedCard.alias}</div>
              <div className="text-xs text-gray-500">
                {selectedProvider?.name} •••• {selectedCard.lastFourDigits}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">
            {creditCards.length === 0 ? 'Nenhum cartão cadastrado' : placeholder}
          </span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && creditCards.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="shadow-lg">
            <CardContent className="p-2 max-h-60 overflow-y-auto">
              {creditCards.map((card) => {
                const cardProvider = providers.find(p => p.id === card.providerId)
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleSelect(card.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: cardProvider?.color || '#8A05BE' }}
                    >
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{card.alias}</div>
                      <div className="text-xs text-gray-500">
                        {cardProvider?.name} •••• {card.lastFourDigits}
                      </div>
                    </div>
                    {value === card.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )
              })}
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
