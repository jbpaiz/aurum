export interface BankAccount {
  id: string
  name: string
  type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
  bank?: string
  icon: string
  color: string
  balance: number
  isActive: boolean
  createdAt: string
  userId?: string
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
  icon: string
  color: string
  isActive: boolean
  createdAt: string
  userId?: string
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  description: string
  paymentMethod: string // Como foi feita: PIX, TED, saque, etc.
  date: string
  createdAt: string
  userId?: string
}

export type AccountType = 'checking' | 'savings' | 'wallet' | 'investment' | 'other'

export const ACCOUNT_TYPES = {
  checking: { label: 'Conta Corrente', icon: '🏦' },
  savings: { label: 'Poupança', icon: '🐷' },
  wallet: { label: 'Carteira', icon: '💰' },
  investment: { label: 'Investimentos', icon: '📈' },
  other: { label: 'Outros', icon: '🏪' }
}

export const PAYMENT_METHOD_TYPES = {
  pix: { label: 'PIX', icon: '📱' },
  cash: { label: 'Dinheiro', icon: '💵' },
  credit_card: { label: 'Cartão de Crédito', icon: '💳' },
  debit_card: { label: 'Cartão de Débito', icon: '🏧' },
  bank_transfer: { label: 'Transferência', icon: '🔄' },
  other: { label: 'Outros', icon: '💼' }
}

export const DEFAULT_BANKS = [
  { id: 'nubank', name: 'Nubank', icon: '💜', iconName: 'CreditCard', color: '#8A05BE' },
  { id: 'bb', name: 'Banco do Brasil', icon: '🟡', iconName: 'Building2', color: '#FFED00' },
  { id: 'caixa', name: 'Caixa Econômica', icon: '🔵', iconName: 'Building2', color: '#0072CE' },
  { id: 'itau', name: 'Itaú', icon: '🔶', iconName: 'Building2', color: '#EC7000' },
  { id: 'bradesco', name: 'Bradesco', icon: '🔴', iconName: 'Building2', color: '#CC092F' },
  { id: 'santander', name: 'Santander', icon: '🔺', iconName: 'Building2', color: '#EC0000' },
  { id: 'inter', name: 'Banco Inter', icon: '🧡', iconName: 'TrendingUp', color: '#FF7A00' },
  { id: 'c6bank', name: 'C6 Bank', icon: '💛', iconName: 'CreditCard', color: '#FFEF00' },
  { id: 'picpay', name: 'PicPay', icon: '💚', iconName: 'Smartphone', color: '#21C25E' },
  { id: 'mercadopago', name: 'Mercado Pago', icon: '💙', iconName: 'Smartphone', color: '#009EE3' },
  { id: 'xp', name: 'XP Investimentos', icon: '⚫', iconName: 'TrendingUp', color: '#000000' },
  { id: 'btg', name: 'BTG Pactual', icon: '⚪', iconName: 'TrendingUp', color: '#1B1B1B' },
  { id: 'other', name: 'Outro Banco', icon: '🏛️', iconName: 'Building2', color: '#6B7280' }
]
