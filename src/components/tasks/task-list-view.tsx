"use client"

import { Fragment, useMemo, useCallback, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { MoveTaskPayload, TaskCard, TaskColumn } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const TABLE_COLUMN_COUNT = 8

interface TaskListViewProps {
  columns: TaskColumn[]
  referenceColumns?: TaskColumn[]
  onSelectTask: (task: TaskCard) => void
  onCreateTask: () => void
  onChangeTaskColumn?: (taskId: string, columnId: string) => Promise<void> | void
  onMoveTask?: (payload: MoveTaskPayload) => Promise<void> | void
}

export function TaskListView({
  columns,
  referenceColumns,
  onSelectTask,
  onCreateTask,
  onChangeTaskColumn,
  onMoveTask
}: TaskListViewProps) {
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

  const dragColumns = referenceColumns ?? columns
  const dragEnabled = Boolean(onMoveTask)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  )
  const columnLookup = useMemo(() => {
    const map = new Map<string, TaskColumn>()
    dragColumns.forEach((column) => {
      map.set(column.id, column)
    })
    return map
  }, [dragColumns])

  const renderDate = (date?: string | null) => {
    if (!date) return <span className="text-gray-400">Sem data</span>
    try {
      return format(new Date(date), "dd 'de' MMM", { locale: ptBR })
    } catch (error) {
      return <span className="text-gray-400">Sem data</span>
    }
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!dragEnabled || !onMoveTask) return

      const { active, over } = event
      if (!over) return

      const taskId = String(active.id)
      const sourceColumnId = active.data.current?.columnId as string | undefined
      if (!sourceColumnId) return

      let targetColumnId = over.data?.current?.columnId as string | undefined
      let targetIndex = 0

      if (over.data?.current?.type === 'task-row') {
        const destinationColumn = targetColumnId ? columnLookup.get(targetColumnId) : undefined
        if (!destinationColumn) return

        const overTaskId = over.data.current.taskId as string
        const orderedTasks = destinationColumn.tasks
        const overIndex = orderedTasks.findIndex((task) => task.id === overTaskId)
        if (overIndex < 0) return
        targetIndex = overIndex

        if (sourceColumnId === targetColumnId) {
          const activeIndex = orderedTasks.findIndex((task) => task.id === taskId)
          if (activeIndex < 0) return
          if (activeIndex < targetIndex) {
            targetIndex -= 1
          }
        }
      } else if (over.data?.current?.type === 'column') {
        targetColumnId = over.data.current.columnId as string
        const destinationColumn = targetColumnId ? columnLookup.get(targetColumnId) : undefined
        targetIndex = destinationColumn ? destinationColumn.tasks.length : 0
      } else if (typeof over.id === 'string') {
        targetColumnId = over.id
        const destinationColumn = columnLookup.get(targetColumnId)
        targetIndex = destinationColumn ? destinationColumn.tasks.length : 0
      }

      if (!targetColumnId) return

      await onMoveTask({
        taskId,
        sourceColumnId,
        targetColumnId,
        targetIndex
      })
    },
    [columnLookup, dragEnabled, onMoveTask]
  )

  if (!tasks.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-600">Nenhuma tarefa combinou com os filtros</p>
        <Button onClick={onCreateTask}>Adicionar tarefa</Button>
      </div>
    )
  }

  const table = (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
        <tr>
          <th className="w-10 px-4 py-3" aria-label="Ordenação" />
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
        {columns.map((column) => (
          <Fragment key={column.id}>
            <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {column.tasks.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  column={column}
                  onSelectTask={onSelectTask}
                  onChangeTaskColumn={onChangeTaskColumn}
                  renderDate={renderDate}
                  columnOptions={dragColumns}
                  dragEnabled={dragEnabled}
                />
              ))}
            </SortableContext>
            {dragEnabled ? <ListColumnDropZone columnId={column.id} /> : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {table}
        </DndContext>
      </div>
    </div>
  )
}

interface TaskListRowProps {
  task: TaskCard
  column: TaskColumn
  onSelectTask: (task: TaskCard) => void
  onChangeTaskColumn?: (taskId: string, columnId: string) => Promise<void> | void
  renderDate: (value?: string | null) => ReactNode
  columnOptions: TaskColumn[]
  dragEnabled: boolean
}

function TaskListRow({ task, column, onSelectTask, onChangeTaskColumn, renderDate, columnOptions, dragEnabled }: TaskListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task-row',
      taskId: task.id,
      columnId: column.id
    },
    disabled: !dragEnabled
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const selectedColumn = columnOptions.find((option) => option.id === task.columnId) ?? column

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer transition-colors hover:bg-blue-50/40',
        isDragging && 'bg-blue-50/60 shadow-sm'
      )}
      onClick={() => onSelectTask(task)}
    >
      <td className="px-4 py-4 align-middle">
        <button
          type="button"
          className="cursor-grab text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:cursor-default active:cursor-grabbing"
          onClick={(event) => event.stopPropagation()}
          aria-label="Arrastar para reordenar"
          {...(dragEnabled ? { ...attributes, ...listeners } : {})}
          disabled={!dragEnabled}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
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
                style={{ backgroundColor: selectedColumn?.color ?? '#CBD5F5' }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedColumn?.name ?? 'Situação'}
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

function ListColumnDropZone({ columnId }: { columnId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-column-${columnId}`,
    data: {
      type: 'column',
      columnId
    }
  })

  return (
    <tr ref={setNodeRef} aria-hidden>
      <td
        colSpan={TABLE_COLUMN_COUNT}
        className={cn('p-0 transition-colors', isOver ? 'bg-blue-50/80' : '')}
        style={{ height: 6 }}
      />
    </tr>
  )
}
