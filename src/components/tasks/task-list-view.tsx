"use client"

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TaskCard, TaskColumn } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskListViewProps {
  columns: TaskColumn[]
  onSelectTask: (task: TaskCard) => void
  onCreateTask: () => void
  onChangeTaskColumn?: (taskId: string, columnId: string) => Promise<void> | void
}

export function TaskListView({ columns, onSelectTask, onCreateTask, onChangeTaskColumn }: TaskListViewProps) {
  const tasks = useMemo(() => {
    return columns.flatMap((column) =>
      column.tasks.map((task) => ({
        ...task,
        columnId: column.id,
        columnName: column.name,
        columnColor: column.color
      }))
    )
  }, [columns])

  if (!tasks.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-600">Nenhuma tarefa combinou com os filtros</p>
        <Button onClick={onCreateTask}>Adicionar tarefa</Button>
      </div>
    )
  }

  const renderDate = (date?: string | null) => {
    if (!date) return <span className="text-gray-400">Sem data</span>
    try {
      return format(new Date(date), "dd 'de' MMM", { locale: ptBR })
    } catch (error) {
      return <span className="text-gray-400">Sem data</span>
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">Chave</th>
              <th className="px-6 py-3">Título</th>
              <th className="px-6 py-3 whitespace-nowrap">Etiquetas</th>
              <th className="px-6 py-3 whitespace-nowrap">Início</th>
              <th className="px-6 py-3 whitespace-nowrap">Fim</th>
              <th className="px-6 py-3 whitespace-nowrap">Situação</th>
              <th className="px-6 py-3 whitespace-nowrap">Prioridade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="cursor-pointer transition-colors hover:bg-blue-50/40"
                onClick={() => onSelectTask(task)}
              >
                <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{task.key}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.description ? (
                    <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                  {task.labels.length ? (
                    <span className="block max-w-[220px] truncate" title={task.labels.join(', ')}>
                      {task.labels.join(', ')}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Sem etiquetas</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{renderDate(task.startDate)}</td>
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{renderDate(task.endDate)}</td>
                <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                  <Select
                    value={task.columnId}
                    onValueChange={(value) => onChangeTaskColumn?.(task.id, value)}
                    disabled={!onChangeTaskColumn}
                  >
                    <SelectTrigger
                      className="h-9 w-[200px] justify-between"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id} className="gap-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                            {column.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TASK_PRIORITY_COLORS[task.priority] }}
                  >
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
