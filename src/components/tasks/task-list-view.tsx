"use client"

import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { TaskCard, TaskColumn, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

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
    <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="w-full">
        <table className="w-full table-auto divide-y divide-gray-200">
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
  const checklistDone = task.checklist.filter((item) => item.done).length
  const hasChecklist = task.checklist.length > 0

  return (
    <tr className="cursor-pointer transition-colors hover:bg-blue-50/40" onClick={() => onSelectTask(task)}>
      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{task.key}</td>
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">{task.title}</p>
        {task.description ? (
          <p className="text-xs text-gray-500 max-w-[320px] truncate" title={task.description}>
            {task.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          {hasChecklist ? (
            <div className="group relative inline-flex">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-0 py-0 text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
                aria-label="Ver checklist"
              >
                <CheckSquare className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                <span className="text-[11px] font-medium text-gray-500">
                  {checklistDone}/{task.checklist.length}
                </span>
              </button>
              <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-[260px] rounded-xl border border-gray-200 bg-white p-3 text-left text-gray-700 opacity-0 shadow-lg transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <p className="text-xs font-semibold text-gray-600">
                  {checklistDone}/{task.checklist.length} itens concluídos
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {task.checklist.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span
                        className={cn(
                          'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                          item.done ? 'bg-emerald-500' : 'bg-gray-300'
                        )}
                      />
                      <span className={cn('flex-1', item.done && 'line-through text-gray-400')}>
                        {item.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <CheckSquare className="h-3.5 w-3.5" aria-hidden />
              <span>Sem checklist</span>
            </div>
          )}
        </div>
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
