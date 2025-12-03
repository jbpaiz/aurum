'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, MoveRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTasks } from '@/contexts/tasks-context'
import type { TaskCard } from '@/types/tasks'

interface MoveTaskModalProps {
  open: boolean
  onClose: () => void
  task: TaskCard
}

export function MoveTaskModal({ open, onClose, task }: MoveTaskModalProps) {
  const { activeProject, activeBoard, moveTaskToBoard } = useTasks()
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedColumnId, setSelectedColumnId] = useState('')
  const [isMoving, setIsMoving] = useState(false)

  // Filtrar apenas quadros diferentes do atual
  const availableBoards = activeProject?.boards.filter(board => board.id !== activeBoard?.id) || []

  // Obter colunas do quadro selecionado
  const selectedBoard = availableBoards.find(board => board.id === selectedBoardId)
  const availableColumns = useMemo(() => selectedBoard?.columns || [], [selectedBoard])

  // Reset quando o modal abre
  useEffect(() => {
    if (open) {
      setSelectedBoardId('')
      setSelectedColumnId('')
      setIsMoving(false)
    }
  }, [open])

  // Auto-selecionar primeira coluna quando trocar de quadro
  useEffect(() => {
    if (selectedBoardId && availableColumns.length > 0) {
      setSelectedColumnId(availableColumns[0].id)
    } else {
      setSelectedColumnId('')
    }
  }, [selectedBoardId, availableColumns])

  const handleMove = async () => {
    if (!selectedBoardId || !selectedColumnId) return

    setIsMoving(true)
    try {
      await moveTaskToBoard(task.id, selectedBoardId, selectedColumnId)
      onClose()
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
    } finally {
      setIsMoving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mover Tarefa</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {task.key} - {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          {availableBoards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Não há outros quadros disponíveis neste projeto.
              </p>
            </div>
          ) : (
            <>
              {/* Seletor de Quadro */}
              <div className="space-y-2">
                <Label htmlFor="board-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quadro de destino
                </Label>
                <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                  <SelectTrigger id="board-select" className="w-full">
                    <SelectValue placeholder="Selecione um quadro" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBoards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de Coluna */}
              {selectedBoardId && (
                <div className="space-y-2">
                  <Label htmlFor="column-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Coluna de destino
                  </Label>
                  <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                    <SelectTrigger id="column-select" className="w-full">
                      <SelectValue placeholder="Selecione uma coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Info visual */}
              {selectedBoardId && selectedColumnId && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-medium">{activeBoard?.name}</span>
                    <MoveRight className="h-4 w-4" />
                    <span className="font-medium">{selectedBoard?.name}</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    A tarefa será movida para: <strong>{availableColumns.find(c => c.id === selectedColumnId)?.name}</strong>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {availableBoards.length > 0 && (
          <div className="mt-6 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isMoving}>
              Cancelar
            </Button>
            <Button
              onClick={handleMove}
              disabled={!selectedBoardId || !selectedColumnId || isMoving}
              className="gap-2"
            >
              {isMoving ? (
                'Movendo...'
              ) : (
                <>
                  <MoveRight className="h-4 w-4" />
                  Mover Tarefa
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
