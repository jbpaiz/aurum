"use client"

import { useMemo, useState, useCallback, useEffect, type ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { TaskCard, TaskColumn, TaskPriority, TaskCustomField } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTasks } from '@/contexts/tasks-context'
import { useUserPreferences } from '@/hooks/use-user-preferences'

type SortKey = 'key' | 'title' | 'labels' | 'startDate' | 'endDate' | 'columnName' | 'priority'
type SortDirection = 'asc' | 'desc'
type SortConfig = { key: SortKey; direction: SortDirection }

const PRIORITY_SEQUENCE: TaskPriority[] = ['lowest', 'low', 'medium', 'high', 'highest']

const normalizeOptionValue = (value: string) =>
  value.toLowerCase().trim().replace(/^opcao_/, 'option_')

const getOptionIndex = (value: string) => {
  const match = normalizeOptionValue(value).match(/option_(\d+)/)
  return match ? Number(match[1]) : null
}

const findPriorityOption = (priorityField: TaskCustomField | undefined, priority: string) =>
  priorityField?.options.find(
    (opt) => normalizeOptionValue(opt.optionValue) === normalizeOptionValue(priority)
  ) ?? priorityField?.options.find(
    (opt) => getOptionIndex(opt.optionValue) !== null && getOptionIndex(opt.optionValue) === getOptionIndex(priority)
  )

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
  adaptiveWidth?: boolean
}

export function TaskListView({ columns, referenceColumns, onSelectTask, onCreateTask, onChangeTaskColumn, adaptiveWidth = false }: TaskListViewProps) {
  const { priorityField } = useTasks()
  const { preferences, updatePreferences } = useUserPreferences()
  
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

  // Carregar ordenação salva ao montar o componente
  useEffect(() => {
    if (preferences && !sortConfig) {
      setSortConfig({
        key: preferences.tasksSortKey,
        direction: preferences.tasksSortDirection
      })
    }
  }, [preferences, sortConfig])

  const renderDate = (date?: string | null) => {
    if (!date) return <span className="text-gray-400 dark:text-gray-500">Sem data</span>
    try {
      const normalized = date.includes('T') ? date : `${date}T00:00:00`
      return format(new Date(normalized), 'dd/MM/yyyy', { locale: ptBR })
    } catch (error) {
      return <span className="text-gray-400 dark:text-gray-500">Sem data</span>
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

      // Comparação primária
      let comparison = 0
      
      if (valueA === valueB) {
        comparison = 0
      } else if (valueA === null || valueA === undefined) {
        comparison = 1 * multiplier
      } else if (valueB === null || valueB === undefined) {
        comparison = -1 * multiplier
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = (valueA - valueB) * multiplier
      } else {
        comparison = String(valueA).localeCompare(String(valueB), 'pt-BR', { sensitivity: 'base' }) * multiplier
      }

      // Se ordenando por startDate e valores são iguais, aplicar ordenação secundária e terciária
      if (comparison === 0 && key === 'startDate') {
        // Secundário: Situação (columnName)
        const columnA = taskA.columnName.toLowerCase()
        const columnB = taskB.columnName.toLowerCase()
        const columnComparison = columnA.localeCompare(columnB, 'pt-BR', { sensitivity: 'base' })
        
        if (columnComparison !== 0) {
          return columnComparison
        }
        
        // Terciário: Prioridade (alfabético pelo label)
        const priorityLabelA =
          findPriorityOption(priorityField, taskA.priority)?.optionLabel ||
          TASK_PRIORITY_LABELS[taskA.priority as keyof typeof TASK_PRIORITY_LABELS]
        const priorityLabelB =
          findPriorityOption(priorityField, taskB.priority)?.optionLabel ||
          TASK_PRIORITY_LABELS[taskB.priority as keyof typeof TASK_PRIORITY_LABELS]
        
        return priorityLabelA.localeCompare(priorityLabelB, 'pt-BR', { sensitivity: 'base' })
      }

      return comparison
    })
  }, [getComparableValue, sortConfig, tasks, priorityField])

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig((current) => {
      const newConfig = !current || current.key !== key
        ? { key, direction: 'asc' as SortDirection }
        : { key, direction: (current.direction === 'asc' ? 'desc' : 'asc') as SortDirection }
      
      // Salvar preferência no banco
      updatePreferences({
        tasksSortKey: newConfig.key,
        tasksSortDirection: newConfig.direction
      })
      
      return newConfig
    })
  }, [updatePreferences])

  if (!tasks.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Nenhuma tarefa combinou com os filtros</p>
        <Button onClick={onCreateTask}>Adicionar tarefa</Button>
      </div>
    )
  }

  return (
    <div className={`w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-full md:max-w-[calc(100vw-280px)] overflow-hidden h-[calc(100vh-205px)]`}>
      <div 
        className="overflow-x-auto overflow-y-auto h-full [scrollbar-width:thin] [scrollbar-color:#CBD5E1_#F1F5F9] dark:[scrollbar-color:#4B5563_#1F2937]"
      >
        <div className={adaptiveWidth ? 'w-full' : 'min-w-[1200px]'}>
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
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
                <SortableHeader label={priorityField?.fieldName || 'Prioridade'} sortKey="priority" sortConfig={sortConfig} onToggleSort={handleSort} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800 text-sm">
            {sortedTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                onChangeTaskColumn={onChangeTaskColumn}
                renderDate={renderDate}
                columnOptions={columnOptions}
                priorityField={priorityField}
              />
            ))}
          </tbody>
        </table>
      </div>
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
  priorityField?: TaskCustomField
}

function TaskListRow({ task, onSelectTask, onChangeTaskColumn, renderDate, columnOptions, priorityField }: TaskListRowProps) {
  const selectedColumn = columnOptions.find((option) => option.id === task.columnId)

  return (
    <tr className="cursor-pointer transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/20" onClick={() => onSelectTask(task)}>
      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{task.key}</td>
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
        {task.subtitle ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[320px] truncate" title={task.subtitle}>
            {task.subtitle}
          </p>
        ) : null}
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
        {task.labels.length ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 max-w-[420px]">
              {task.labels.map((label) => (
                <Badge key={label} variant="outline" className="border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-xs px-2 py-0 whitespace-normal break-words max-w-[160px]">
                  <span className="block">{label}</span>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">Sem etiquetas</span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{renderDate(task.startDate)}</td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{renderDate(task.endDate)}</td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
        <Select
          value={task.columnId}
          onValueChange={(value) => onChangeTaskColumn?.(task.id, value)}
          disabled={!onChangeTaskColumn}
        >
          <SelectTrigger
            className="h-9 w-[200px] justify-between dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedColumn?.color ?? task.columnColor ?? '#CBD5F5' }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          style={{
            backgroundColor:
              findPriorityOption(priorityField, task.priority)?.color ||
              TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS] ||
              '#94A3B8'
          }}
        >
          {findPriorityOption(priorityField, task.priority)?.optionLabel ||
            TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
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
      className="flex items-center gap-2 rounded-md px-1 py-0.5 text-gray-600 dark:text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400"
      onClick={(event) => {
        event.stopPropagation()
        onToggleSort(sortKey)
      }}
      aria-pressed={isActive}
      title={tooltip}
    >
      <span>{label}</span>
      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} aria-hidden />
      {isActive ? (
        <span className="sr-only">
          {direction === 'asc' ? 'ordenado ascendente' : 'ordenado descendente'}
        </span>
      ) : null}
    </button>
  )
}
