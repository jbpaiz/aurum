'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckSquare, Paperclip, AlertCircle, Flag, Play, Check } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskCard } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_TYPE_LABEL } from '@/types/tasks'

interface KanbanCardProps {
  task: TaskCard
  onSelect: (task: TaskCard) => void
  onToggleChecklistItem?: (taskId: string, checklistItemId: string, done: boolean) => Promise<void> | void
}

export function KanbanCard({ task, onSelect, onToggleChecklistItem }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id,
      columnId: task.columnId
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const checklistTotal = task.checklist.length
  const checklistDone = task.checklist.filter((item) => item.done).length
  const checklistLabel = checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : undefined

  const hasAttachments = task.attachments.length > 0
  const formatShortDate = (value?: string | null) => {
    if (!value) return null
    const normalized = value.includes('T') ? value : `${value}T00:00:00`
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) return null
    return format(parsed, 'dd/MM/yyyy')
  }
  const startLabel = formatShortDate(task.startDate)
  const endLabel = formatShortDate(task.endDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm dark:shadow-gray-900/50 transition hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md',
        isDragging && 'ring-2 ring-blue-200 dark:ring-blue-800'
      )}
    >
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">{task.key}</span>
        <span
          className="inline-flex h-6 items-center gap-1 rounded-full px-2"
          style={{ backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}22`, color: TASK_PRIORITY_COLORS[task.priority] }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TASK_PRIORITY_COLORS[task.priority] }} />
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white break-words">{task.title}</p>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400 break-words">{task.description}</p>
      )}

      {task.checklist.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/50 p-2">
          {task.checklist.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-xs">
              <button
                type="button"
                className={cn(
                  'mt-0.5 flex h-4 w-4 items-center justify-center rounded border text-white transition',
                  onToggleChecklistItem ? 'cursor-pointer' : 'cursor-default opacity-60',
                  item.done ? 'border-emerald-500 bg-emerald-500 dark:border-emerald-600 dark:bg-emerald-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-transparent'
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!onToggleChecklistItem) return
                  void onToggleChecklistItem(task.id, item.id, !item.done)
                }}
                aria-pressed={item.done}
                aria-label={item.done ? 'Marcar item como pendente' : 'Marcar item como concluído'}
                disabled={!onToggleChecklistItem}
              >
                {item.done ? <Check className="h-3 w-3" /> : null}
              </button>
              <span className={cn('flex-1 text-gray-600 dark:text-gray-400', item.done && 'line-through text-gray-400 dark:text-gray-500')}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
          {TASK_TYPE_LABEL[task.type]}
        </Badge>
        {task.labels.map((label) => (
          <Badge key={label} variant="outline" className="border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
            {label}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {startLabel && (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Play className="h-3.5 w-3.5" />
            Início {startLabel}
          </span>
        )}

        {endLabel && (
          <span className="inline-flex items-center gap-1 text-blue-700">
            <Flag className="h-3.5 w-3.5" />
            Fim {endLabel}
          </span>
        )}

        {checklistLabel && (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" />
            {checklistLabel}
          </span>
        )}

        {hasAttachments && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachments.length}
          </span>
        )}

        {task.isBlocked && (
          <span className="inline-flex items-center gap-1 text-orange-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Bloqueado
          </span>
        )}
      </div>
    </div>
  )
}
