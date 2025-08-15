'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Building2, 
  Wallet, 
  TrendingUp, 
  CreditCard,
  PiggyBank,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BankAccount, ACCOUNT_TYPES, DEFAULT_BANKS } from '@/types/accounts'
import { useAccounts } from '@/contexts/accounts-context'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  account?: BankAccount | null
  mode: 'add' | 'edit'
}

const ACCOUNT_ICONS = [
  { value: 'Building2', label: 'Banco', component: Building2 },
  { value: 'CreditCard', label: 'Cartão', component: CreditCard },
  { value: 'Wallet', label: 'Carteira', component: Wallet },
  { value: 'PiggyBank', label: 'Poupança', component: PiggyBank },
  { value: 'TrendingUp', label: 'Investimento', component: TrendingUp },
  { value: 'Banknote', label: 'Dinheiro', component: Banknote },
  { value: 'Target', label: 'Meta', component: Target },
  { value: 'Store', label: 'Loja', component: Store },
  { value: 'Home', label: 'Casa', component: Home },
  { value: 'Car', label: 'Veículo', component: Car },
  { value: 'Briefcase', label: 'Trabalho', component: Briefcase },
  { value: 'Smartphone', label: 'Digital', component: Smartphone },
  { value: 'Coffee', label: 'Gastos', component: Coffee },
  { value: 'ShoppingCart', label: 'Compras', component: ShoppingCart }
]

const ACCOUNT_COLORS = [
  '#8A05BE', '#EC7000', '#0072CE', '#CC092F', 
  '#EC0000', '#FF7A00', '#FFEF00', '#21C25E',
  '#009EE3', '#000000', '#1B1B1B', '#6B7280',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
]

export function AccountModal({ isOpen, onClose, account, mode }: AccountModalProps) {
  const { addAccount, updateAccount } = useAccounts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as BankAccount['type'],
    bank: '',
    icon: 'Building2',
    color: '#8A05BE',
    balance: 0,
    isActive: true
  })

  // Atualizar formulário quando a conta mudar (para modo de edição)
  useEffect(() => {
    if (account && mode === 'edit') {
      setFormData({
        name: account.name,
        type: account.type,
        bank: account.bank || '',
        icon: account.icon,
        color: account.color,
        balance: account.balance,
        isActive: account.isActive
      })
    } else if (mode === 'add') {
      // Reset para modo de adição
      setFormData({
        name: '',
        type: 'checking',
        bank: '',
        icon: 'Building2',
        color: '#8A05BE',
        balance: 0,
        isActive: true
      })
    }
  }, [account, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'add') {
        await addAccount(formData)
      } else if (mode === 'edit' && account) {
        await updateAccount(account.id, formData)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBankSelect = (bankId: string) => {
    const selectedBank = DEFAULT_BANKS.find(bank => bank.id === bankId)
    if (selectedBank) {
      setFormData({
        ...formData,
        bank: selectedBank.name,
        icon: selectedBank.iconName || 'Building2',
        color: selectedBank.color
      })
    } else if (bankId === '') {
      // Se deselecionar o banco, manter o ícone atual
      setFormData({
        ...formData,
        bank: ''
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === 'add' ? 'Adicionar Conta' : 'Editar Conta'}
              </CardTitle>
              <CardDescription>
                {mode === 'add' 
                  ? 'Cadastre uma nova conta bancária ou carteira'
                  : 'Edite as informações da conta'
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
            {/* Nome da Conta */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Conta Corrente Nubank"
                required
              />
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conta</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BankAccount['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(ACCOUNT_TYPES).map(([value, { label, icon }]) => (
                  <option key={value} value={value}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Banco (opcional) */}
            {(formData.type === 'checking' || formData.type === 'savings' || formData.type === 'investment') && (
              <div className="space-y-2">
                <Label htmlFor="bank">Banco</Label>
                <select
                  id="bank"
                  value={DEFAULT_BANKS.find(bank => bank.name === formData.bank)?.id || ''}
                  onChange={(e) => handleBankSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o banco</option>
                  {DEFAULT_BANKS.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.icon} {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ícone */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-4 gap-2">
                {ACCOUNT_ICONS.map((iconOption) => {
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
                {ACCOUNT_COLORS.map((color) => (
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

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo {mode === 'add' ? 'Inicial' : 'Atual'}</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 border rounded-md flex items-center gap-3" style={{ borderColor: formData.color }}>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {(() => {
                    const selectedIcon = ACCOUNT_ICONS.find(icon => icon.value === formData.icon)
                    if (selectedIcon) {
                      const IconComponent = selectedIcon.component
                      return <IconComponent className="h-5 w-5" />
                    }
                    return <Building2 className="h-5 w-5" />
                  })()}
                </div>
                <div>
                  <div className="font-medium">{formData.name || 'Nome da conta'}</div>
                  <div className="text-sm text-gray-500">
                    {ACCOUNT_TYPES[formData.type]?.label}
                    {formData.bank && ` • ${formData.bank}`}
                  </div>
                </div>
                <div className="ml-auto font-semibold" style={{ color: formData.color }}>
                  R$ {formData.balance.toFixed(2).replace('.', ',')}
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
                disabled={loading || !formData.name.trim()}
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
