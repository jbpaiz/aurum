'use client'

import { useState } from 'react'
import { X, CreditCard as CreditCardIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useCards } from '@/contexts/cards-context'
import { useToast } from '@/hooks/use-toast'
import { CardProvider } from '@/types/cards'

interface AddCardModalProps {
  onClose: () => void
}

export function AddCardModal({ onClose }: AddCardModalProps) {
  const { providers, addCard } = useCards()
  const { toast } = useToast()
  
  const [selectedProvider, setSelectedProvider] = useState<CardProvider | null>(null)
  const [formData, setFormData] = useState({
    alias: '',
    lastFourDigits: '',
    type: 'credit' as 'credit' | 'debit'
  })
  const [loading, setLoading] = useState(false)

  const handleProviderSelect = (provider: CardProvider) => {
    setSelectedProvider(provider)
    // Auto-preencher o alias com o nome da operadora
    setFormData(prev => ({
      ...prev,
      alias: provider.name === 'Outro' ? '' : provider.name
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProvider) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma operadora"
      })
      return
    }

    if (!formData.alias.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um nome para o cartão"
      })
      return
    }

    if (formData.lastFourDigits && formData.lastFourDigits.length !== 4) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Os últimos 4 dígitos devem ter exatamente 4 números"
      })
      return
    }

    setLoading(true)

    try {
      await addCard({
        providerId: selectedProvider.id,
        alias: formData.alias.trim(),
        lastFourDigits: formData.lastFourDigits || undefined,
        type: formData.type,
        isActive: true
      })

      toast({
        variant: "success",
        title: "Cartão adicionado!",
        description: `${formData.alias} foi adicionado com sucesso`
      })

      onClose()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar cartão. Tente novamente."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Adicionar Cartão
              </CardTitle>
              <CardDescription>
                Cadastre um novo cartão de crédito ou débito
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Seleção da Operadora */}
          <div className="space-y-3">
            <Label>Operadora</Label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleProviderSelect(provider)}
                  className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm ${
                    selectedProvider?.id === provider.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{provider.icon}</span>
                    <span className="font-medium text-sm">{provider.name}</span>
                  </div>
                  {provider.popularBrands && provider.popularBrands.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {provider.popularBrands.slice(0, 2).map((brand) => (
                        <Badge key={brand} variant="outline" className="text-xs">
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedProvider && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo do Cartão */}
              <div className="space-y-2">
                <Label>Tipo do Cartão</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'credit' }))}
                    className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm ${
                      formData.type === 'credit'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    disabled={!selectedProvider.supportedTypes.includes('credit')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <span className="font-medium text-sm">Crédito</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para compras parceladas
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'debit' }))}
                    className={`p-3 border rounded-lg text-left transition-all hover:shadow-sm ${
                      formData.type === 'debit'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    disabled={!selectedProvider.supportedTypes.includes('debit')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏧</span>
                      <span className="font-medium text-sm">Débito</span>
               