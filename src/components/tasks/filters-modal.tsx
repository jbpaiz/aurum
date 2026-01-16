'use client'

import { Search, X, Filter as FilterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, type TaskPriority } from '@/types/tasks'

interface FiltersModalProps {
  open: boolean
  onClose: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  priorityFilter: TaskPriority | 'all'
  onPriorityChange: (value: TaskPriority | 'all') => void
  priorityField?: { fieldName: string }
  labelFilter: string
  onLabelChange: (value: string) => void
}

export function FiltersModal({
  open,
  onClose,
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  priorityField,
  labelFilter,
  onLabelChange
}: FiltersModalProps) {
  const hasActiveFilters = searchTerm || priorityFilter !== 'all' || labelFilter

  const clearFilters = () => {
    onSearchChange('')
    onPriorityChange('all')
    onLabelChange('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtrar tarefas</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs dark:text-gray-300 dark:hover:text-white">
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 p-6">
          {/* Buscar */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Título ou descrição"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {priorityField?.fieldName || 'Prioridade'}
            </label>
            <Select value={priorityFilter} onValueChange={(value) => onPriorityChange(value as TaskPriority | 'all')}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-600">Todas</SelectItem>
                {Object.entries(TASK_PRIORITY_COLORS).map(([value, color]) => (
                  <SelectItem key={value} value={value} className="dark:text-white dark:focus:bg-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {TASK_PRIORITY_LABELS[value as TaskPriority]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Etiquetas */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Etiquetas
            </label>
            <div className="relative">
              <Input
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Ex: backend, frontend"
                value={labelFilter}
                onChange={(e) => onLabelChange(e.target.value)}
              />
              {labelFilter && (
                <button
                  onClick={() => onLabelChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
