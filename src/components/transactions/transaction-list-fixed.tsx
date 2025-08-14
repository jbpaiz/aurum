'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Trash2,
  Calendar,
  Tag,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCards } from '@/contexts/cards-context'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  date: string
  cardId?: string
  installments?: number
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  showBalance?: boolean
}

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  showBalance = true 
}: TransactionListProps) {
  const { getProviderById, cards } = useCards()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00')
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateString
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nenhuma transação encontrada
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione sua primeira transação para começar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        // Buscar informações do cartão se houver
        const card = transaction.cardId ? cards.find(c => c.id === transaction.cardId) : null
        const provider = card ? getProviderById(card.providerId) : null
        
        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">
                    {transaction.description}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {transaction.category}
                  </Badge>
                  
                  {/* Badge do cartão se houver */}
                  {card && provider && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: provider.color + '80',
                        color: provider.color 
                      }}
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {provider.icon} {card.alias}
                    </Badge>
                  )}
                  
                  {/* Badge de parcelas se houver */}
                  {transaction.installments && transaction.installments > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.installments}x
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatDate(transaction.date)}
                  {card?.lastFourDigits && (
                    <span className="ml-2 font-mono">
                      ••••{card.lastFourDigits}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showBalance ? (
                    <>
                      {transaction.type === 'expense' ? '- ' : '+ '}
                      {formatCurrency(transaction.amount)}
                    </>
                  ) : (
                    '••••••'
                  )}
                </div>
              </div>

              {(onEdit || onDelete) && (
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
