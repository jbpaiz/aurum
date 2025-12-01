export interface CardProvider {
  id: string
  name: string
  icon: string
  color: string
  popularBrands?: string[]
  supportedTypes: ('credit' | 'debit')[]
}

export interface CreditCard {
  id: string
  providerId: string
  accountId?: string
  alias: string // Nome personalizado para o cartão
  lastFourDigits?: string
  type: 'credit' | 'debit' // Tipo do cartão
  isActive: boolean
  createdAt: string
  userId?: string
  creditLimit?: number // Limite do cartão de crédito
  currentBalance?: number // Saldo atual/fatura (positivo = deve, negativo = crédito)
  dueDay?: number // Dia de vencimento da fatura (1-31)
  closingDay?: number // Dia de fechamento da fatura (1-31)
}

export interface CardTransaction {
  id: string
  cardId: string
  amount: number
  description: string
  category: string
  date: string
  installments?: number
  currentInstallment?: number
  isInstallment?: boolean
  originalTransactionId?: string
}

export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash'

export const PAYMENT_METHODS = {
  credit: { label: 'Cartão de Crédito', icon: '💳' },
  debit: { label: 'Cartão de Débito', icon: '🏧' },
  pix: { label: 'PIX', icon: '📱' },
  cash: { label: 'Dinheiro', icon: '💵' }
}

export const DEFAULT_CARD_PROVIDERS: CardProvider[] = [
  {
    id: 'nubank',
    name: 'Nubank',
    icon: '💜',
    color: '#8A05BE',
    popularBrands: ['Nubank', 'Nu'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    icon: '💙',
    color: '#009EE3',
    popularBrands: ['Mercado Pago', 'MP'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'picpay',
    name: 'PicPay',
    icon: '💚',
    color: '#21C25E',
    popularBrands: ['PicPay'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    icon: '🧡',
    color: '#FF7A00',
    popularBrands: ['Inter', 'Banco Inter'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'c6bank',
    name: 'C6 Bank',
    icon: '💛',
    color: '#FFEF00',
    popularBrands: ['C6', 'C6 Bank'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'itau',
    name: 'Itaú',
    icon: '🔶',
    color: '#EC7000',
    popularBrands: ['Itaú', 'Itaucard'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    icon: '🔴',
    color: '#CC092F',
    popularBrands: ['Bradesco', 'Bradescard'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'santander',
    name: 'Santander',
    icon: '🔺',
    color: '#EC0000',
    popularBrands: ['Santander', 'Santander Esfera'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    icon: '🟡',
    color: '#FFED00',
    popularBrands: ['BB', 'Banco do Brasil', 'Ourocard'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    icon: '🔵',
    color: '#0072CE',
    popularBrands: ['Caixa', 'Caixa Econômica'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    icon: '⚫',
    color: '#000000',
    popularBrands: ['XP', 'XP Investimentos'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    icon: '⚪',
    color: '#1B1B1B',
    popularBrands: ['BTG', 'BTG Pactual'],
    supportedTypes: ['credit', 'debit']
  },
  {
    id: 'other',
    name: 'Outro',
    icon: '💳',
    color: '#6B7280',
    popularBrands: [],
    supportedTypes: ['credit', 'debit']
  }
]
