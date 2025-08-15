'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Building2,
  Wallet,
  PiggyBank,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentMethod, PAYMENT_METHOD_TYPES } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  paymentMethod?: PaymentMethod | null
  mode: 'add' | 'edit'
}

const PAYMENT_METHOD_ICONS = [
  { value: 'CreditCard', label: 'Cartão', component: CreditCard },
  { value: 'Banknote', label: 'Dinheiro', component: Banknote },
  { value: 'Smartphone', label: 'PIX/Digital', component: Smartphone },
  { value: 'ArrowRightLeft', label: 'Transferência', component: ArrowRightLeft },
  { value: 'Building2', label: 'Banco', component: Building2 },
  { value: 'Wallet', label: 'Carteira', component: Wallet }
]

const PAYMENT_METHOD_COLORS = [
  '#8A05BE', '#EC7000', '#0072CE', '#CC092F', 
  '#EC0000', '#FF7A00', '#FFEF00', '#21C25E',
  '#009EE3', '#000000', '#1B1B1B', '#6B7280',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
]

export function PaymentMethodModal({ isOpen, onClose, paymentMethod, mode }: PaymentMethodModalProps) {
  const { addPaymentMethod, updatePaymentMethod, accounts } = useAccounts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'pix' as PaymentMethod['type'],
    accountId: '',
    cardId: undefined as string | undefined,
    icon: 'Smartphone',
    color: '#21C25E',
    isActive: true
  })

  // Atualizar formulário quando a forma de pagamento mudar (para modo de edição)
  useEffect(() => {
    if (paymentMethod && mode === 'edit') {
      setFormData({
        name: paymentMethod.name,
        type: paymentMethod.type,
        accountId: paymentMethod.accountId,
        cardId: paymentMethod.cardId,
        icon: paymentMethod.icon,
        color: paymentMethod.color,
        isActive: paymentMethod.isActive
      })
    } else if (mode === 'add') {
      // Reset para modo de adição
      setFormData({
        name: '',
        type: 'pix',
        accountId: '',
        cardId: undefined,
        icon: 'Smartphone',
        color: '#21C25E',
        isActive: true
      })
    }
  }, [paymentMethod, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const paymentMethodData = {
        ...formData,
        cardId: formData.cardId || undefined
      }

      if (mode === 'add') {
        await addPaymentMethod(paymentMethodData)
      } else if (mode === 'edit' && paymentMethod) {
        await updatePaymentMethod(paymentMethod.id, paymentMethodData)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: PaymentMethod['type']) => {
    setFormData({
      ...formData,
      type,
      icon: getDefaultIconForType(type),
      color: getDefaultColorForType(type)
    })
  }

  const getDefaultIconForType = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'pix':
        return 'Smartphone'
      case 'cash':
        return 'Banknote'
      case 'credit_card':
      case 'debit_card':
        return 'CreditCard'
      case 'bank_transfer':
        return 'ArrowRightLeft'
      default:
        return 'CreditCard'
    }
  }

  const getDefaultColorForType = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'pix':
        return '#21C25E'
      case 'cash':
        return '#10B981'
      case 'credit_card':
        return '#8A05BE'
      case 'debit_card':
        return '#3B82F6'
      case 'bank_transfer':
        return '#EC7000'
      default:
        return '#6B7280'
    }
  }

  const renderIcon = (iconName: string) => {
    const iconOption = PAYMENT_METHOD_ICONS.find(icon => icon.value === iconName)
    if (iconOption) {
      const IconComponent = iconOption.component
      return <IconComponent className="h-5 w-5" />
    }
    return <CreditCard className="h-5 w-5" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === 'add' ? 'Adicionar Forma de Pagamento' : 'Editar Forma de Pagamento'}
              </CardTitle>
              <CardDescription>
                {mode === 'add' 
                  ? 'Cadastre uma nova forma de pagamento vinculada a uma conta'
                  : 'Edite as informações da forma de pagamento'
                }
              </CardDescription>
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

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da Forma de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Forma de Pagamento</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: PIX Nubank, Cartão Itaú"
                required
              />
            </div>

            {/* Tipo de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Pagamento</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as PaymentMethod['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(PAYMENT_METHOD_TYPES).map(([value, { label, icon }]) => (
                  <option key={value} value={value}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Conta Vinculada */}
            <div className="space-y-2">
              <Label htmlFor="accountId">Conta Vinculada</Label>
              <select
                id="accountId"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione a conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.bank || 'Carteira'}
                  </option>
                ))}
              </select>
            </div>

            {/* Cartão (se aplicável) */}
            {(formData.type === 'credit_card' || formData.type === 'debit_card') && (
              <div className="space-y-2">
                <Label htmlFor="cardId">Cartão (Opcional)</Label>
                <select
                  id="cardId"
                  value={formData.cardId || ''}
                  onChange={(e) => setFormData({ ...formData, cardId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum cartão específico</option>
                  {/* Cartões serão adicionados quando a funcionalidade de cartões estiver implementada */}
                </select>
              </div>
            )}

            {/* Ícone */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHOD_ICONS.map((iconOption) => {
                  const IconComponent = iconOption.component
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                      className={`p-3 border rounded-md hover:bg-gray-50 flex items-center justify-center ${
                        formData.icon === iconOption.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                      title={iconOption.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {PAYMENT_METHOD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color 
                        ? 'border-gray-800' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 border rounded-md flex items-center gap-3" style={{ borderColor: formData.color }}>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {renderIcon(formData.icon)}
                </div>
                <div>
                  <div className="font-medium">{formData.name || 'Nome da forma de pagamento'}</div>
                  <div className="text-sm text-gray-500">
                    {PAYMENT_METHOD_TYPES[formData.type]?.label}
                    {formData.accountId && (
                      <span> • {accounts.find(acc => acc.id === formData.accountId)?.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !formData.name.trim() || !formData.accountId}
              >
                {loading ? 'Salvando...' : (mode === 'add' ? 'Adicionar' : 'Salvar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
