'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanCard } from '@/components/tasks/kanban-card'
import type { TaskCard, TaskColumn } from '@/types/tasks'

interface KanbanColumnProps {
  column: TaskColumn
  onSelectTask: (task: TaskCard) => void
  onCreateTask: (columnId: string) => void
  onToggleChecklistItem?: (taskId: string, checklistItemId: string, done: boolean) => Promise<void> | void
  columnWidthClass?: string
}

export function KanbanColumn({ column, onSelectTask, onCreateTask, onToggleChecklistItem, columnWidthClass }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id
    }
  })
  const widthClass = columnWidthClass ?? 'w-80'

  return (
    <div className={`flex ${widthClass} flex-shrink-0 flex-col`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{column.name}</p>
          <p className="text-xs text-gray-500">{column.tasks.length} itens</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500"
          onClick={() => onCreateTask(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-3 ${
          isOver ? 'border-blue-400 bg-blue-50/60' : ''
        }`}
      >
        <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onToggleChecklistItem={onToggleChecklistItem}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <button
            type="button"
            className="rounded-lg border border-dashed border-gray-300 bg-white py-6 text-sm text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
            onClick={() => onCreateTask(column.id)}
          >
            Adicionar primeiro cartão
          </button>
        )}
      </div>
    </div>
  )
}
