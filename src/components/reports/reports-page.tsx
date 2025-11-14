'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Loader2,
  PieChart,
  Save,
} from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTransactions, type TransactionRecord } from '@/hooks/use-transactions'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/database.types'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const parseDateSafe = (value?: string) => {
  if (!value) return null
  try {
    return parseISO(value)
  } catch {
    return null
  }
}

const formatDate = (date: string) => {
  try {
    return format(parseISO(date), 'dd/MM/yyyy')
  } catch {
    return date
  }
}

const formatDateRangeLabel = (start?: string, end?: string) => {
  const formatVerbose = (value: string) => {
    try {
      return format(parseISO(value), "dd 'de' MMMM", { locale: ptBR })
    } catch {
      return value
    }
  }

  if (start && end) {
    return `Período de ${formatVerbose(start)} a ${formatVerbose(end)}`
  }
  if (start) {
    return `A partir de ${formatVerbose(start)}`
  }
  if (end) {
    return `Até ${formatVerbose(end)}`
  }
  return 'Todas as movimentações registradas'
}

export function ReportsPage() {
  const { transactions, loading, error } = useTransactions()
  const { toast } = useToast()
  const { user } = useAuth()

  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const filteredTransactions = useMemo(() => {
    const start = parseDateSafe(filters.startDate)
    const end = parseDateSafe(filters.endDate)

    return transactions.filter((transaction) => {
      if (transaction.type === 'transfer') {
        return false
      }

      const txDate = parseDateSafe(transaction.date)
      if (!txDate) {
        return false
      }
      if (start && txDate < start) {
        return false
      }
      if (end && txDate > end) {
        return false
      }
      return true
    })
  }, [transactions, filters])

  const incomes = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.type === 'income'),
    [filteredTransactions]
  )

  const expenses = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.type === 'expense'),
    [filteredTransactions]
  )

  const totalIncome = useMemo(
    () => incomes.reduce((sum, transaction) => sum + transaction.amount, 0),
    [incomes]
  )
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, transaction) => sum + transaction.amount, 0),
    [expenses]
  )
  const netBalance = totalIncome - totalExpenses

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()

    filteredTransactions.forEach((transaction) => {
      const key = transaction.category || 'Sem categoria'
      const current = map.get(key) || { income: 0, expense: 0 }
      if (transaction.type === 'income') {
        current.income += transaction.amount
      }
      if (transaction.type === 'expense') {
        current.expense += transaction.amount
      }
      map.set(key, current)
    })

    return Array.from(map.entries())
      .map(([category, totals]) => ({
        category,
        ...totals,
        total: totals.income + totals.expense,
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredTransactions])

  const saveReport = async () => {
    if (!user) {
      toast({
        title: 'Faça login para salvar',
        description: 'Você precisa estar autenticado para salvar relatórios.',
        variant: 'destructive',
      })
      return
    }

    if (!filteredTransactions.length) {
      toast({
        title: 'Nada para salvar',
        description: 'Nenhuma receita ou despesa encontrada para o filtro selecionado.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      const sortedDates = [...filteredTransactions]
        .map((transaction) => transaction.date)
        .sort()

      const periodStart = filters.startDate || sortedDates[0]
      const periodEnd = filters.endDate || sortedDates[sortedDates.length - 1]

      const { data: report, error: reportError } = await supabase
        .from('financial_reports')
        .insert({
          user_id: user.id,
          title: `Relatório ${formatDateRangeLabel(periodStart, periodEnd)}`,
          period_start: periodStart,
          period_end: periodEnd,
          total_income: totalIncome,
          total_expense: totalExpenses,
          net_total: netBalance,
          filters: {
            startDate: filters.startDate ?? null,
            endDate: filters.endDate ?? null,
          },
        })
        .select('id')
        .single()

      if (reportError || !report) {
        throw new Error(reportError?.message || 'Falha ao salvar o relatório')
      }

      const lineItems: Database['public']['Tables']['financial_report_lines']['Insert'][] =
        filteredTransactions.map((transaction) => ({
        report_id: report.id,
        user_id: user.id,
        transaction_id: transaction.id,
          type: transaction.type === 'income' ? 'income' : 'expense',
          amount: transaction.amount,
          category: transaction.category ?? null,
          description: transaction.description ?? null,
          transaction_date: transaction.date,
        }))

      if (lineItems.length) {
        const { error: linesError } = await supabase
          .from('financial_report_lines')
          .insert(lineItems)

        if (linesError) {
          throw new Error(linesError.message)
        }
      }

      setLastSavedAt(new Date().toISOString())
      toast({
        title: 'Relatório salvo com sucesso',
        description: 'Você pode reenviar o relatório a qualquer momento com novos filtros.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao salvar relatório',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const exportCsv = () => {
    if (!filteredTransactions.length) {
      toast({
        title: 'Nada para exportar',
        description: 'Filtre ou registre novas transações para exportar.',
      })
      return
    }

    const header = 'Tipo,Descrição,Categoria,Data,Valor\n'
    const rows = filteredTransactions
      .map((transaction) => {
        const safeDescription = transaction.description.replace(/"/g, "''")
        const safeCategory = (transaction.category || 'Sem categoria').replace(/"/g, "''")
        return `"${transaction.type}","${safeDescription}","${safeCategory}","${formatDate(
          transaction.date
        )}",${transaction.amount}`
      })
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `aurum-relatorio-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Exportação iniciada',
      description: 'O arquivo CSV foi gerado com as transações filtradas.',
    })
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 bg-gray-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios de Receitas e Despesas</h1>
            <p className="text-gray-600">
              Visualize todas as movimentações financeiras e gere relatórios completos para auditoria.
            </p>
            <p className="text-sm text-gray-500">{formatDateRangeLabel(filters.startDate, filters.endDate)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={loading || !filteredTransactions.length}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
            <Button onClick={saveReport} disabled={loading || isSaving || !filteredTransactions.length}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar no Supabase
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine o período desejado para gerar seu relatório.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data inicial</label>
              <Input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, startDate: event.target.value || undefined }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data final</label>
              <Input
                type="date"
                value={filters.endDate ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, endDate: event.target.value || undefined }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Resumo</label>
              <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500">
                {filteredTransactions.length} transações selecionadas
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{currencyFormatter.format(totalIncome)}</div>
              <p className="text-xs text-gray-500">{incomes.length} lançamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{currencyFormatter.format(totalExpenses)}</div>
              <p className="text-xs text-gray-500">{expenses.length} lançamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado</CardTitle>
              <PieChart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {currencyFormatter.format(netBalance)}
              </div>
              <p className="text-xs text-gray-500">
                {netBalance >= 0 ? 'Saldo positivo no período' : 'Atenção: saldo negativo'}
              </p>
              {lastSavedAt && (
                <p className="text-xs text-gray-400">Último relatório salvo em {formatDate(lastSavedAt)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border border-rose-200 bg-rose-50">
            <CardContent className="py-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionsTable title="Receitas" transactions={incomes} emptyLabel="Nenhuma receita encontrada" />
          <TransactionsTable title="Despesas" transactions={expenses} emptyLabel="Nenhuma despesa encontrada" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Principais categorias</CardTitle>
            <CardDescription>Categorias com maior peso financeiro no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma categoria encontrada para o filtro atual.</p>
            )}
            {categoryBreakdown.slice(0, 6).map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{category.category}</p>
                  <p className="text-xs text-gray-500">
                    +{currencyFormatter.format(category.income)} / -{currencyFormatter.format(category.expense)}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold text-gray-700">
                  {currencyFormatter.format(category.total)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-gray-500">
              Carregando transações...
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

interface TransactionsTableProps {
  title: string
  transactions: TransactionRecord[]
  emptyLabel: string
}

function TransactionsTable({ title, transactions, emptyLabel }: TransactionsTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{transactions.length} itens</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">{emptyLabel}</p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{transaction.description}</td>
                    <td className="px-4 py-3 text-gray-500">{transaction.category}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(transaction.date)}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {currencyFormatter.format(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
