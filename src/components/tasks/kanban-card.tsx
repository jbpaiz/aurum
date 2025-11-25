'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, CheckSquare, Paperclip, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskCard } from '@/types/tasks'
import { TASK_PRIORITY_COLORS, TASK_TYPE_LABEL } from '@/types/tasks'

interface KanbanCardProps {
  task: TaskCard
  onSelect: (task: TaskCard) => void
}

export function KanbanCard({ task, onSelect }: KanbanCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow-md',
        isDragging && 'ring-2 ring-blue-200'
      )}
    >
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{task.key}</span>
        <span
          className="inline-flex h-6 items-center gap-1 rounded-full px-2"
          style={{ backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}22`, color: TASK_PRIORITY_COLORS[task.priority] }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TASK_PRIORITY_COLORS[task.priority] }} />
          {task.priority.toUpperCase()}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900">{task.title}</p>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {TASK_TYPE_LABEL[task.type]}
        </Badge>
        {task.labels.map((label) => (
          <Badge key={label} variant="outline" className="border-gray-200 text-gray-600">
            {label}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {task.dueDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(task.dueDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short'
            })}
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
