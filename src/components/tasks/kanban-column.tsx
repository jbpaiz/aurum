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
  isOver?: boolean
}

export function KanbanColumn({ column, onSelectTask, onCreateTask, onToggleChecklistItem, columnWidthClass, isOver: isOverProp }: KanbanColumnProps) {
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id
    }
  })
  const widthClass = columnWidthClass ?? 'w-80'
  
  // Usar a prop isOver se fornecida, caso contrário usar isOverDroppable
  const isOver = isOverProp !== undefined ? isOverProp : isOverDroppable

  return (
    <div className={`flex ${widthClass} flex-shrink-0 flex-col h-full`}>
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{column.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{column.tasks.length} itens</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => onCreateTask(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-xl border-2 p-3 transition-all duration-200 ${
          isOver 
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/40 shadow-lg scale-[1.02]' 
            : 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/50'
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
            className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-6 text-sm text-gray-500 dark:text-gray-400 transition hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onCreateTask(column.id)}
          >
            Adicionar primeiro cartão
          </button>
        )}
      </div>
    </div>
  )
}
