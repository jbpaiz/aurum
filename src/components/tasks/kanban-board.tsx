'use client'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core'
import type { UniqueIdentifier } from '@dnd-kit/core'
import { useState } from 'react'
import { KanbanColumn } from '@/components/tasks/kanban-column'
import { KanbanCard } from '@/components/tasks/kanban-card'
import type { TaskCard, TaskColumn } from '@/types/tasks'
import type { MoveTaskPayload } from '@/types/tasks'

interface KanbanBoardProps {
  columns: TaskColumn[]
  onSelectTask: (task: TaskCard) => void
  onCreateTask: (columnId?: string) => void
  moveTask: (payload: MoveTaskPayload) => Promise<void>
  onToggleChecklistItem?: (taskId: string, checklistItemId: string, done: boolean) => Promise<void> | void
  adaptiveWidth?: boolean
}

export function KanbanBoard({ columns, onSelectTask, onCreateTask, moveTask, onToggleChecklistItem, adaptiveWidth = false }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const [activeCard, setActiveCard] = useState<TaskCard | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  const columnCount = columns.length
  
  // Calcular largura das colunas baseado na quantidade e modo adaptativo
  const getColumnWidthClass = () => {
    if (!adaptiveWidth) {
      return 'w-[368px]'
    }
    
    // No modo adaptativo, distribuir igualmente o espaço disponível
    // Mantém um mínimo de 280px e máximo de 400px por coluna
    if (columnCount === 1) return 'flex-1 max-w-[600px]'
    if (columnCount === 2) return 'flex-1 max-w-[500px]'
    if (columnCount === 3) return 'flex-1 max-w-[450px]'
    return 'flex-1 min-w-[280px] max-w-[400px]'
  }
  
  const columnWidthClass = getColumnWidthClass()

  const findTaskById = (taskId: UniqueIdentifier): TaskCard | null => {
    for (const column of columns) {
      const task = column.tasks.find((item) => item.id === taskId)
      if (task) return task
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = findTaskById(active.id)
    setActiveCard(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    setOverId(null)
    if (!over) return

    const taskId = String(active.id)
    const sourceColumnId = active.data.current?.columnId as string

    let targetColumnId = over.data?.current?.columnId as string | undefined
    let targetIndex = 0

    if (over.data?.current?.type === 'task') {
      targetColumnId = over.data.current.columnId
      const overTaskId = over.data.current.taskId as string
      const targetColumn = columns.find((column) => column.id === targetColumnId)
      if (!targetColumn) return

      targetIndex = targetColumn.tasks.findIndex((task) => task.id === overTaskId)
      const sameColumn = sourceColumnId === targetColumnId
      const activeIndex = sameColumn
        ? targetColumn.tasks.findIndex((task) => task.id === taskId)
        : -1

      if (sameColumn && activeIndex < targetIndex) {
        targetIndex -= 1
      }
    } else if (over.data?.current?.type === 'column') {
      targetColumnId = over.data.current.columnId as string
      const targetColumn = columns.find((column) => column.id === targetColumnId)
      targetIndex = targetColumn ? targetColumn.tasks.length : 0
    } else {
      targetColumnId = String(over.id)
      const fallbackColumn = columns.find((column) => column.id === targetColumnId)
      targetIndex = fallbackColumn ? fallbackColumn.tasks.length : 0
    }

    if (!targetColumnId) return

    await moveTask({
      taskId,
      sourceColumnId,
      targetColumnId,
      targetIndex
    })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={`flex gap-4 pb-4 ${adaptiveWidth ? 'w-full' : ''}`}>
        {columns.map((column) => {
          // Determinar se esta coluna está com hover (considerando se o mouse está sobre ela ou sobre um card dela)
          const isColumnOver = overId === column.id || 
            column.tasks.some(task => task.id === overId)
          
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              onSelectTask={onSelectTask}
              onCreateTask={() => onCreateTask(column.id)}
              onToggleChecklistItem={onToggleChecklistItem}
              columnWidthClass={columnWidthClass}
              isOver={isColumnOver}
            />
          )
        })}
      </div>

      <DragOverlay>{activeCard ? <KanbanCard task={activeCard} onSelect={() => undefined} /> : null}</DragOverlay>
    </DndContext>
  )
}
