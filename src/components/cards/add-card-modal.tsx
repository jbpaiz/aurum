'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard as CreditCardIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useCards } from '@/contexts/cards-context'
import { useSimpleToast } from '@/hooks/use-simple-toast'
import { CardProvider } from '@/types/cards'

interface AddCardModalProps {
  onClose: () => void
}

// Chave para persistir dados do formulário
const STORAGE_KEY = 'add_card_form_data'
const STORAGE_PROVIDER_KEY = 'add_card_provider'

export function AddCardModal({ onClose }: AddCardModalProps) {
  const { providers, addCard } = useCards()
  const { showToast } = useSimpleToast()
  
  // Recuperar dados salvos do sessionStorage
  const [selectedProvider, setSelectedProvider] = useState<CardProvider | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem(STORAGE_PROVIDER_KEY)
    if (saved) {
      try {
        const providerId = JSON.parse(saved)
        return providers.find(p => p.id === providerId) || null
      } catch {
        return null
      }
    }
    return null
  })
  
  const [formData, setFormData] = useState(() => {
    if (typeof window === 'undefined') {
      return { alias: '', lastFourDigits: '', type: 'credit' as 'credit' | 'debit' }
    }
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return { alias: '', lastFourDigits: '', type: 'credit' as 'credit' | 'debit' }
      }
    }
    return { alias: '', lastFourDigits: '', type: 'credit' as 'credit' | 'debit' }
  })
  
  const [loading, setLoading] = useState(false)

  // Salvar dados no sessionStorage quando mudarem
  useEffect(() => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (selectedProvider) {
      sessionStorage.setItem(STORAGE_PROVIDER_KEY, JSON.stringify(selectedProvider.id))
    }
  }, [selectedProvider])

  const handleProviderSelect = (provider: CardProvider) => {
    setSelectedProvider(provider)
    // Auto-preencher o alias com o nome da operadora
    setFormData((prev: typeof formData) => ({
      ...prev,
      alias: provider.name === 'Outro' ? '' : provider.name
    }))
  }

  const clearPersistedData = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_PROVIDER_KEY)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProvider) {
      showToast({
        type: "error",
        title: "Erro",
        description: "Selecione uma operadora"
      })
      return
    }

    if (!formData.alias.trim()) {
      showToast({
        type: "error",
        title: "Erro",
        description: "Digite um nome para o cartão"
      })
      return
    }

    if (formData.lastFourDigits && formData.lastFourDigits.length !== 4) {
      showToast({
        type: "error",
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

      showToast({
        type: "success",
        title: "Cartão adicionado!",
        description: `${formData.alias} foi adicionado com sucesso`
      })

      // Limpar dados salvos após sucesso
      clearPersistedData()
      onClose()
    } catch (error) {
      showToast({
        type: "error",
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
                    onClick={() => setFormData((prev: typeof formData) => ({ ...prev, type: 'credit' }))}
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
                    onClick={() => setFormData((prev: typeof formData) => ({ ...prev, type: 'debit' }))}
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
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desconto na hora
                    </p>
                  </button>
                </div>
              </div>

              {/* Nome do Cartão */}
              <div className="space-y-2">
                <Label htmlFor="alias">Nome do Cartão</Label>
                <Input
                  id="alias"
                  placeholder="Ex: Nubank Principal, Itaú Pessoal..."
                  value={formData.alias}
                  onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, alias: e.target.value }))}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Um nome para identificar este cartão facilmente
                </p>
              </div>

              {/* Últimos 4 Dígitos (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="lastFourDigits">Últimos 4 dígitos (opcional)</Label>
                <Input
                  id="lastFourDigits"
                  placeholder="1234"
                  value={formData.lastFourDigits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setFormData((prev: typeof formData) => ({ ...prev, lastFourDigits: value }))
                  }}
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Para ajudar na identificação (opcional)
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adicionando...' : 'Adicionar Cartão'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
