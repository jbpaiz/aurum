'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_at: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
          <p className="text-muted-foreground text-center">
            Comece adicionando sua primeira receita ou despesa clicando no botão &quot;Nova Transação&quot;
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{transaction.description}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(transaction.date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
