"use client"

import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SortKey = 'key' | 'title' | 'labels' | 'startDate' | 'endDate' | 'columnName' | 'priority'
type SortDirection = 'asc' | 'desc'
type SortConfig = { key: SortKey; direction: SortDirection }

const PRIORITY_SEQUENCE: TaskPriority[] = ['lowest', 'low', 'medium', 'high', 'highest']

interface TaskWithMeta extends TaskCard {
  columnName: string
  columnColor: string
}

interface TaskListViewProps {
  columns: TaskColumn[]
  referenceColumns?: TaskColumn[]
  onSelectTask: (task: TaskCard) => void
  onCreateTask: () => void
  onChangeTaskColumn?: (taskId: string, columnId: string) => Promise<void> | void
}

export function TaskListView({ columns, referenceColumns, onSelectTask, onCreateTask, onChangeTaskColumn }: TaskListViewProps) {
  const tasks = useMemo<TaskWithMeta[]>(() => {
    return columns.flatMap((column) =>
      column.tasks.map((task) => ({
        ...task,
        columnId: column.id,
        columnName: column.name,
        columnColor: column.color
      }))
    )
  }, [columns])

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const columnOptions = referenceColumns ?? columns

  const renderDate = (date?: string | null) => {
    if (!date) return <span className="text-gray-400">Sem data</span>
    try {
      const normalized = date.includes('T') ? date : `${date}T00:00:00`
      return format(new Date(normalized), 'dd/MM/yyyy', { locale: ptBR })
    } catch (error) {
      return <span className="text-gray-400">Sem data</span>
    }
  }

  const getComparableValue = useCallback((task: TaskWithMeta, key: SortKey) => {
    switch (key) {
      case 'key':
        return task.key.toLowerCase()
      case 'title':
        return task.title.toLowerCase()
      case 'labels':
        return task.labels.join(', ').toLowerCase()
      case 'startDate':
        return task.startDate ? new Date(task.startDate).getTime() : null
      case 'endDate':
        return task.endDate ? new Date(task.endDate).getTime() : null
      case 'columnName':
        return task.columnName.toLowerCase()
      case 'priority':
        return PRIORITY_SEQUENCE.indexOf(task.priority)
      default:
        return null
    }
  }, [])

  const sortedTasks = useMemo(() => {
    if (!sortConfig) return tasks

    const { key, direction } = sortConfig
    const multiplier = direction === 'asc' ? 1 : -1

    return [...tasks].sort((taskA, taskB) => {
      const valueA = getComparableValue(taskA, key)
      const valueB = getComparableValue(taskB, key)

      if (valueA === valueB) return 0
      if (valueA === null || valueA === undefined) return 1 * multiplier
      if (valueB === null || valueB === undefined) return -1 * multiplier

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * multiplier
      }

      return String(valueA).localeCompare(String(valueB), 'pt-BR', { sensitivity: 'base' }) * multiplier
    })
  }, [getComparableValue, sortConfig, tasks])

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      }
    })
  }, [])

  if (!tasks.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-600">Nenhuma tarefa combinou com os filtros</p>
        <Button onClick={onCreateTask}>Adicionar tarefa</Button>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Chave" sortKey="key" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3">
                <SortableHeader label="Título" sortKey="title" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Etiquetas" sortKey="labels" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Início" sortKey="startDate" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Fim" sortKey="endDate" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Situação" sortKey="columnName" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                <SortableHeader label="Prioridade" sortKey="priority" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {sortedTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                onChangeTaskColumn={onChangeTaskColumn}
                renderDate={renderDate}
                columnOptions={columnOptions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TaskListRowProps {
  task: TaskWithMeta
  onSelectTask: (task: TaskCard) => void
  onChangeTaskColumn?: (taskId: string, columnId: string) => Promise<void> | void
  renderDate: (value?: string | null) => ReactNode
  columnOptions: TaskColumn[]
}

function TaskListRow({ task, onSelectTask, onChangeTaskColumn, renderDate, columnOptions }: TaskListRowProps) {
  const selectedColumn = columnOptions.find((option) => option.id === task.columnId)

  return (
    <tr className="cursor-pointer transition-colors hover:bg-blue-50/40" onClick={() => onSelectTask(task)}>
      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{task.key}</td>
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">{task.title}</p>
        {task.description ? <p className="text-xs text-gray-500 truncate">{task.description}</p> : null}
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
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedColumn?.color ?? task.columnColor ?? '#CBD5F5' }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedColumn?.name ?? task.columnName ?? 'Situação'}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {columnOptions.map((option) => (
              <SelectItem key={option.id} value={option.id} className="gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                  {option.name}
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
  )
}

interface SortableHeaderProps {
  label: string
  sortKey: SortKey
  sortConfig: SortConfig | null
  onToggleSort: (key: SortKey) => void
}

function SortableHeader({ label, sortKey, sortConfig, onToggleSort }: SortableHeaderProps) {
  const isActive = sortConfig?.key === sortKey
  const direction = sortConfig?.direction ?? 'asc'
  const tooltip = isActive
    ? `Ordenar ${label} em ordem ${direction === 'asc' ? 'descendente' : 'ascendente'}`
    : `Ordenar ${label} em ordem ascendente`

  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-md px-1 py-0.5 text-gray-600 transition hover:text-blue-600"
      onClick={(event) => {
        event.stopPropagation()
        onToggleSort(sortKey)
      }}
      aria-pressed={isActive}
      title={tooltip}
    >
      <span>{label}</span>
      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} aria-hidden />
      {isActive ? (
        <span className="sr-only">
          {direction === 'asc' ? 'ordenado ascendente' : 'ordenado descendente'}
        </span>
      ) : null}
    </button>
  )
}
