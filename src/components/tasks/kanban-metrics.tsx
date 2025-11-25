'use client'

import { useMemo } from 'react'
import { differenceInCalendarDays, addDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_LABELS } from '@/types/tasks'

interface KanbanMetricsProps {
  columns: TaskColumn[]
}

const PRIORITY_ORDER: TaskPriority[] = ['highest', 'high', 'medium', 'low', 'lowest']

const formatDays = (value: number) => `${value.toFixed(1)} dia${value >= 2 ? 's' : ''}`
const safeDate = (value?: string | null, fallback: Date = new Date()) => {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export function KanbanMetrics({ columns }: KanbanMetricsProps) {
  const metrics = useMemo(() => {
    const now = new Date()
    const tasks = columns.flatMap((column) => column.tasks)

    const totalTasks = tasks.length
    const completedTasks = columns
      .filter((column) => column.category === 'done')
      .reduce((total, column) => total + column.tasks.length, 0)

    const avgLeadTime = tasks.length
      ? tasks.reduce((total, task) => total + Math.max(0, differenceInCalendarDays(now, safeDate(task.createdAt, now))), 0) / tasks.length
      : 0

    const columnThroughput = columns.map((column) => {
      if (!column.tasks.length) {
        return { name: column.name, averageDays: 0, count: 0 }
      }
      const sum = column.tasks.reduce((total, task) => {
        const reference = task.updatedAt ?? task.createdAt
        return total + Math.max(0, differenceInCalendarDays(now, safeDate(reference, now)))
      }, 0)
      return {
        name: column.name,
        count: column.tasks.length,
        averageDays: sum / column.tasks.length
      }
    })

    const maxColumnAverage = columnThroughput.reduce((max, column) => Math.max(max, column.averageDays), 0)

    const priorityDistribution = PRIORITY_ORDER.map((priority) => ({
      priority,
      label: TASK_PRIORITY_LABELS[priority],
      count: tasks.filter((task) => task.priority === priority).length
    }))
    const maxPriorityCount = priorityDistribution.reduce((max, item) => Math.max(max, item.count), 0)

    const overdueTasks = tasks.filter((task) => task.dueDate && safeDate(task.dueDate) < now)
    const dueSoonLimit = addDays(now, 7)
    const dueSoonTasks = tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = safeDate(task.dueDate)
      return dueDate >= now && dueDate <= dueSoonLimit
    })

    const upcomingMilestones = tasks
      .filter((task) => task.dueDate)
      .sort((a, b) => safeDate(a.dueDate).getTime() - safeDate(b.dueDate).getTime())
      .slice(0, 3)
      .map((task) => ({
        id: task.id,
        title: task.title,
        columnName: columns.find((column) => column.id === task.columnId)?.name ?? 'Coluna',
        dueDate: task.dueDate
          ? safeDate(task.dueDate).toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short'
            })
          : 'Sem prazo'
      }))

    return {
      totalTasks,
      completedTasks,
      avgLeadTime,
      columnThroughput,
      maxColumnAverage,
      priorityDistribution,
      maxPriorityCount,
      overdueTasks,
      dueSoonTasks,
      upcomingMilestones
    }
  }, [columns])

  if (!columns.length) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-gray-500">Crie um quadro e tarefas para visualizar métricas.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-gray-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tarefas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{metrics.totalTasks}</p>
            <p className="text-xs text-gray-500">{metrics.completedTasks} concluidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tempo médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{formatDays(metrics.avgLeadTime)}</p>
            <p className="text-xs text-gray-500">desde a criação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Prazos críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{metrics.overdueTasks.length}</p>
            <p className="text-xs text-gray-500">atrasadas • {metrics.dueSoonTasks.length} vencem em 7 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Colunas monitoradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{columns.length}</p>
            <p className="text-xs text-gray-500">{metrics.columnThroughput.filter((column) => column.count > 0).length} com fluxo ativo</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Tempo médio por coluna</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.columnThroughput.map((column) => (
              <div key={column.name}>
                <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>{column.name}</span>
                  <span>{column.count} cards · {formatDays(column.averageDays)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: metrics.maxColumnAverage ? `${(column.averageDays / metrics.maxColumnAverage) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Distribuição por prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.priorityDistribution.map((item) => (
              <div key={item.priority}>
                <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>{item.label}</span>
                  <span>{item.count} tarefas</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: metrics.maxPriorityCount ? `${(item.count / metrics.maxPriorityCount) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Alertas de prazo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.overdueTasks.length === 0 && metrics.dueSoonTasks.length === 0 ? (
              <p className="text-sm text-gray-500">Sem alertas no momento.</p>
            ) : (
              <>
                {metrics.overdueTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-sm text-red-700">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-red-500">Venceu em {task.dueDate ? safeDate(task.dueDate).toLocaleDateString('pt-BR') : 'data não definida'}</p>
                  </div>
                ))}
                {metrics.dueSoonTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm text-amber-700">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-amber-500">
                      Vence em {task.dueDate ? safeDate(task.dueDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : 'sem data'}
                    </p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Próximos marcos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.upcomingMilestones.length === 0 ? (
              <p className="text-sm text-gray-500">Adicione datas limite para acompanhar marcos.</p>
            ) : (
              metrics.upcomingMilestones.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.columnName}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white text-gray-700">
                    {item.dueDate}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
