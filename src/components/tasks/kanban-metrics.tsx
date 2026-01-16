'use client'

import { useMemo } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_LABELS } from '@/types/tasks'

interface KanbanMetricsProps {
  columns: TaskColumn[]
  priorityField?: { fieldName: string }
}

const PRIORITY_ORDER: TaskPriority[] = ['highest', 'high', 'medium', 'low', 'lowest']

const formatDays = (value: number) => `${value.toFixed(1)} dia${value >= 2 ? 's' : ''}`
const safeDate = (value?: string | null, fallback: Date = new Date()) => {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export function KanbanMetrics({ columns, priorityField }: KanbanMetricsProps) {
  const metrics = useMemo(() => {
    const now = new Date()
    const tasks = columns.flatMap((column) => column.tasks)
    const columnMap = new Map(columns.map((column) => [column.id, column]))

    const annotateTask = (task: TaskCard) => ({
      id: task.id,
      title: task.title,
      columnName: columnMap.get(task.columnId)?.name ?? 'Coluna',
      startDate: task.startDate,
      endDate: task.endDate
    })

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

    const startedLast7Count = tasks.filter(
      (task) => task.startDate && differenceInCalendarDays(now, safeDate(task.startDate, now)) <= 7
    ).length

    const completedLast7Count = tasks.filter(
      (task) => task.endDate && differenceInCalendarDays(now, safeDate(task.endDate, now)) <= 7
    ).length

    const inProgressNoStart = tasks
      .filter((task) => {
        const column = columnMap.get(task.columnId)
        return column?.category === 'in_progress' && !task.startDate
      })
      .map(annotateTask)

    const doneWithoutEnd = tasks
      .filter((task) => {
        const column = columnMap.get(task.columnId)
        return column?.category === 'done' && !task.endDate
      })
      .map(annotateTask)

    const timeline = tasks
      .filter((task) => task.startDate || task.endDate)
      .sort(
        (a, b) =>
          safeDate(b.endDate ?? b.startDate, now).getTime() - safeDate(a.endDate ?? a.startDate, now).getTime()
      )
      .slice(0, 4)
      .map((task) => {
        const annotated = annotateTask(task)
        const startLabel = annotated.startDate
          ? safeDate(annotated.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : '—'
        const endLabel = annotated.endDate
          ? safeDate(annotated.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : '—'
        return {
          ...annotated,
          startLabel,
          endLabel
        }
      })

    return {
      totalTasks,
      completedTasks,
      avgLeadTime,
      columnThroughput,
      maxColumnAverage,
      priorityDistribution,
      maxPriorityCount,
      startedLast7Count,
      completedLast7Count,
      inProgressNoStart,
      doneWithoutEnd,
      timeline
    }
  }, [columns])

  if (!columns.length) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Crie um quadro e tarefas para visualizar métricas.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Tarefas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{metrics.totalTasks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.completedTasks} concluidas</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Tempo médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{formatDays(metrics.avgLeadTime)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">desde a criação</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Iniciadas (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{metrics.startedLast7Count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">datas de início recentes</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Concluídas (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{metrics.completedLast7Count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">datas de fim registradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Tempo médio por coluna</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.columnThroughput.map((column) => (
              <div key={column.name}>
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                  <span>{column.name}</span>
                  <span>{column.count} cards · {formatDays(column.averageDays)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500 dark:bg-blue-600"
                    style={{ width: metrics.maxColumnAverage ? `${(column.averageDays / metrics.maxColumnAverage) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Distribuição por {priorityField?.fieldName || 'prioridade'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.priorityDistribution.map((item) => (
              <div key={item.priority}>
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                  <span>{item.label}</span>
                  <span>{item.count} tarefas</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-orange-500 dark:bg-orange-600"
                    style={{ width: metrics.maxPriorityCount ? `${(item.count / metrics.maxPriorityCount) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Datas pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Início em aberto</p>
              {metrics.inProgressNoStart.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Todas as tarefas em andamento possuem data inicial.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {metrics.inProgressNoStart.slice(0, 4).map((task) => (
                    <div key={`start-${task.id}`} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">{task.columnName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Fim em aberto</p>
              {metrics.doneWithoutEnd.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Nenhuma tarefa concluída está sem data final.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {metrics.doneWithoutEnd.slice(0, 4).map((task) => (
                    <div key={`end-${task.id}`} className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">{task.columnName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Linha do tempo recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.timeline.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sem registros de início ou fim ainda.</p>
            ) : (
              metrics.timeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.columnName}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>Início {item.startLabel}</p>
                    <p>Fim {item.endLabel}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
