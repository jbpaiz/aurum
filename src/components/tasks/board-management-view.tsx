'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, ArrowLeft, ArrowRight, CornerUpLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTasks } from '@/contexts/tasks-context'

interface BoardManagementViewProps {
  onBack?: () => void
}

const AUTO_SAVE_DELAY = 700

export function BoardManagementView({ onBack }: BoardManagementViewProps) {
  const {
    activeProject,
    activeBoard,
    setActiveBoardId,
    createBoard,
    renameBoard,
    deleteBoard,
    createColumn,
    renameColumn,
    reorderColumn
  } = useTasks()

  const boards = useMemo(() => activeProject?.boards ?? [], [activeProject])
  const columns = useMemo(() => activeBoard?.columns ?? [], [activeBoard])

  const [boardNames, setBoardNames] = useState<Record<string, string>>({})
  const [columnNames, setColumnNames] = useState<Record<string, string>>({})
  const [newBoardName, setNewBoardName] = useState('')
  const [newColumnName, setNewColumnName] = useState('')
  const [creatingBoard, setCreatingBoard] = useState(false)
  const [creatingColumn, setCreatingColumn] = useState(false)
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null)
  const [reorderingColumnId, setReorderingColumnId] = useState<string | null>(null)
  const [savingBoards, setSavingBoards] = useState<Record<string, boolean>>({})
  const [savingColumns, setSavingColumns] = useState<Record<string, boolean>>({})

  const boardTimers = useRef<Record<string, number>>({})
  const columnTimers = useRef<Record<string, number>>({})

  useEffect(() => {
    const drafts: Record<string, string> = {}
    boards.forEach((board) => {
      drafts[board.id] = board.name
    })
    setBoardNames(drafts)
  }, [boards])

  useEffect(() => {
    const drafts: Record<string, string> = {}
    columns.forEach((column) => {
      drafts[column.id] = column.name
    })
    setColumnNames(drafts)
    setNewColumnName('')
  }, [columns])

  useEffect(() => () => {
    Object.values(boardTimers.current).forEach((timer) => window.clearTimeout(timer))
    Object.values(columnTimers.current).forEach((timer) => window.clearTimeout(timer))
  }, [])

  const persistBoardRename = useCallback(async (boardId: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const current = boards.find((board) => board.id === boardId)
    if (current && current.name === trimmed) return
    setSavingBoards((prev) => ({
      ...prev,
      [boardId]: true
    }))
    try {
      await renameBoard(boardId, trimmed)
    } finally {
      setSavingBoards((prev) => ({
        ...prev,
        [boardId]: false
      }))
    }
  }, [boards, renameBoard])

  const persistColumnRename = useCallback(async (columnId: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const current = columns.find((column) => column.id === columnId)
    if (current && current.name === trimmed) return
    setSavingColumns((prev) => ({
      ...prev,
      [columnId]: true
    }))
    try {
      await renameColumn(columnId, trimmed)
    } finally {
      setSavingColumns((prev) => ({
        ...prev,
        [columnId]: false
      }))
    }
  }, [columns, renameColumn])

  const scheduleBoardRename = useCallback((boardId: string, value: string) => {
    setBoardNames((prev) => ({
      ...prev,
      [boardId]: value
    }))
    if (boardTimers.current[boardId]) {
      window.clearTimeout(boardTimers.current[boardId])
    }
    boardTimers.current[boardId] = window.setTimeout(() => persistBoardRename(boardId, value), AUTO_SAVE_DELAY)
  }, [persistBoardRename])

  const scheduleColumnRename = useCallback((columnId: string, value: string) => {
    setColumnNames((prev) => ({
      ...prev,
      [columnId]: value
    }))
    if (columnTimers.current[columnId]) {
      window.clearTimeout(columnTimers.current[columnId])
    }
    columnTimers.current[columnId] = window.setTimeout(() => persistColumnRename(columnId, value), AUTO_SAVE_DELAY)
  }, [persistColumnRename])

  const handleCreateBoard = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = newBoardName.trim()
    if (!name) return
    setCreatingBoard(true)
    try {
      await createBoard(name)
      setNewBoardName('')
    } finally {
      setCreatingBoard(false)
    }
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (boards.length <= 1) {
      window.alert('Mantenha pelo menos um quadro por projeto.')
      return
    }
    const boardName = boardNames[boardId] ?? 'este quadro'
    const confirmed = window.confirm(`Excluir "${boardName}"? Essa ação não pode ser desfeita.`)
    if (!confirmed) return
    setDeletingBoardId(boardId)
    try {
      await deleteBoard(boardId)
    } finally {
      setDeletingBoardId(null)
    }
  }

  const handleCreateColumn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeBoard) return
    const name = newColumnName.trim()
    if (!name) return
    setCreatingColumn(true)
    try {
      await createColumn(name)
      setNewColumnName('')
    } finally {
      setCreatingColumn(false)
    }
  }

  const handleMoveColumn = async (columnId: string, direction: 'left' | 'right') => {
    setReorderingColumnId(columnId)
    try {
      await reorderColumn(columnId, direction)
    } finally {
      setReorderingColumnId(null)
    }
  }

  const renderBoardMeta = (boardId: string) => {
    if (savingBoards[boardId]) {
      return <span className="text-xs text-blue-600">Salvando...</span>
    }
    const board = boards.find((item) => item.id === boardId)
    if (!board) return null
    const updatedAt = new Date(board.updatedAt).toLocaleDateString('pt-BR')
    return <span className="text-xs text-gray-500">Atualizado em {updatedAt}</span>
  }

  const renderColumnMeta = (columnId: string) => {
    if (savingColumns[columnId]) {
      return <span className="text-xs text-blue-600">Salvando...</span>
    }
    const column = columns.find((item) => item.id === columnId)
    if (!column) return null
    return (
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {column.category.replace('_', ' ')}
      </span>
    )
  }

  if (!activeProject) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
        Nenhum projeto encontrado. Crie um projeto para começar a gerenciar quadros.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Configurações do Kanban</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Gerenciar quadros e colunas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Todas as alterações são salvas automaticamente. Aplique ajustes enquanto navega entre diferentes quadros.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onBack && (
              <Button variant="outline" className="gap-2" onClick={onBack}>
                <CornerUpLeft className="h-4 w-4" />
                Voltar para o quadro
              </Button>
            )}
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {boards.length} quadros
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quadros do projeto</h3>
              <p className="text-sm text-gray-500">Selecione um quadro para editar suas colunas ou renomeie-o rapidamente.</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {boards.length} ativos
            </Badge>
          </header>

          <form onSubmit={handleCreateBoard} className="flex flex-col gap-2 rounded-2xl bg-gray-50/80 p-4 sm:flex-row">
            <Input
              placeholder="Nome do novo quadro"
              value={newBoardName}
              onChange={(event) => setNewBoardName(event.target.value)}
              disabled={creatingBoard}
            />
            <Button type="submit" className="gap-2" disabled={creatingBoard}>
              <Plus className="h-4 w-4" />
              Adicionar quadro
            </Button>
          </form>

          <div className="space-y-3">
            {boards.map((board) => {
              const active = board.id === activeBoard?.id
              return (
                <div
                  key={board.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-2xl border p-4 transition',
                    active ? 'border-blue-200 bg-blue-50/70' : 'border-gray-200'
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Input
                      value={boardNames[board.id] ?? ''}
                      onChange={(event) => scheduleBoardRename(board.id, event.target.value)}
                      onBlur={() => persistBoardRename(board.id, boardNames[board.id] ?? '')}
                      disabled={savingBoards[board.id] || deletingBoardId === board.id}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        onClick={() => setActiveBoardId(board.id)}
                        disabled={active}
                      >
                        {active ? 'Quadro ativo' : 'Editar colunas'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDeleteBoard(board.id)}
                        disabled={deletingBoardId === board.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{board.columns.length} colunas</span>
                    {renderBoardMeta(board.id)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Colunas do quadro</h3>
              <p className="text-sm text-gray-500">
                {activeBoard ? 'Renomeie, reordene ou crie colunas para o quadro selecionado.' : 'Escolha um quadro para começar.'}
              </p>
            </div>
            {activeBoard && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                {columns.length} colunas
              </Badge>
            )}
          </header>

          {activeBoard ? (
            <>
              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div key={column.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Input
                        value={columnNames[column.id] ?? ''}
                        onChange={(event) => scheduleColumnRename(column.id, event.target.value)}
                        onBlur={() => persistColumnRename(column.id, columnNames[column.id] ?? '')}
                        disabled={savingColumns[column.id] || reorderingColumnId === column.id}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={index === 0 || reorderingColumnId === column.id}
                          onClick={() => handleMoveColumn(column.id, 'left')}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={index === columns.length - 1 || reorderingColumnId === column.id}
                          onClick={() => handleMoveColumn(column.id, 'right')}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {renderColumnMeta(column.id)}
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateColumn} className="mt-4 flex flex-col gap-2 rounded-2xl bg-gray-50/80 p-4 sm:flex-row">
                <Input
                  placeholder="Nome da nova coluna"
                  value={newColumnName}
                  onChange={(event) => setNewColumnName(event.target.value)}
                  disabled={creatingColumn}
                />
                <Button type="submit" className="gap-2" disabled={creatingColumn}>
                  <Plus className="h-4 w-4" />
                  Adicionar coluna
                </Button>
              </form>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              Selecione um quadro para ver e editar suas colunas.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
