'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import type { TaskBoard, TaskProject, TaskPriority } from '@/types/tasks'
import { TASK_PRIORITY_LABELS } from '@/types/tasks'
import { toast } from 'sonner'

// SheetJS is imported dynamically to avoid bundling server-side
// We will load it at export time

interface ExportTasksModalProps {
  open: boolean
  onClose: () => void
  projects: TaskProject[]
  activeProjectId?: string | null
  activeBoardId?: string | null
}

export function ExportTasksModal({ open, onClose, projects, activeProjectId, activeBoardId }: ExportTasksModalProps) {
  const [scope, setScope] = useState<'allBoards' | 'currentBoard'>('currentBoard')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [label, setLabel] = useState<string>('')
  const [assignee, setAssignee] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [includeComments, setIncludeComments] = useState(true)
  const [includeChecklist, setIncludeChecklist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      // reset
      setScope('currentBoard')
      setPriority('all')
      setLabel('')
      setAssignee('')
      setDateFrom('')
      setDateTo('')
      setIncludeComments(true)
      setIncludeChecklist(false)
    }
  }, [open])

  const availableBoards = useMemo(() => {
    if (!projects) return [] as TaskBoard[]
    const project = projects.find(p => p.id === activeProjectId) || projects[0]
    return project?.boards ?? []
  }, [projects, activeProjectId])

  const priorityOptions = useMemo(() => {
    return Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
      <SelectItem key={k} value={k}>{v}</SelectItem>
    ))
  }, [])

  if (!open) return null

  const gatherTasks = () => {
    const boards = scope === 'allBoards' ? availableBoards : availableBoards.filter(b => b.id === activeBoardId)
    const rows: Record<string, any>[] = []

    boards.forEach(board => {
      board.columns.forEach(col => {
        col.tasks.forEach(task => {
          // Filters
          if (priority !== 'all' && task.priority !== priority) return
          if (label && !task.labels.some(l => l.toLowerCase().includes(label.toLowerCase()))) return
          if (assignee && task.assigneeId !== assignee) return
          if (dateFrom && task.startDate && new Date(task.startDate) < new Date(dateFrom)) return
          if (dateTo && task.endDate && new Date(task.endDate) > new Date(dateTo)) return

          rows.push({
            Project: projects.find(p => p.id === board.projectId)?.name ?? '—',
            Board: board.name,
            Column: col.name,
            Key: task.key,
            Title: task.title,
            Subtitle: task.subtitle ?? '',
            Description: task.description ?? '',
            Type: task.type,
            Priority: TASK_PRIORITY_LABELS[task.priority],
            AssigneeId: task.assigneeId ?? '',
            ReporterId: task.reporterId ?? '',
            StartDate: task.startDate ?? '',
            DueDate: task.endDate ?? '',
            Labels: task.labels.join(', '),
            StoryPoints: task.storyPoints ?? '',
            EstimateHours: task.estimateHours ?? '',
            IsBlocked: task.isBlocked ? 'Yes' : 'No',
            BlockedReason: task.blockedReason ?? '',
            Checklist: includeChecklist ? (task.checklist.map(i => `${i.title}${i.done ? ' (done)' : ''}`).join(' | ') ) : '',
            Comments: includeComments ? (task.comments?.map(c => `${c.userId}: ${c.body}`).join(' || ') ?? '') : ''
          })
        })
      })
    })

    return rows
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const rows = gatherTasks()
      if (!rows.length) {
        toast.error('Nenhuma tarefa encontrada para os filtros selecionados')
        setLoading(false)
        return
      }

      // Load SheetJS dynamically
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Tarefas')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const filename = `aurum-tarefas-${format(new Date(), 'yyyyMMdd-HHmm')}.xlsx`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Exportação iniciada')
      onClose()
    } catch (error) {
      console.error('Erro ao exportar tarefas:', error)
      toast.error('Erro ao exportar tarefas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Exportar tarefas</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Escopo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentBoard">Quadro atual</SelectItem>
                <SelectItem value="allBoards">Todos os quadros deste projeto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Filtros (opcional)</Label>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-2">
              <div>
                <Label className="text-[11px]">Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {priorityOptions}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Etiqueta</Label>
                <Input placeholder="ex: backend" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-2" />
              </div>

              <div>
                <Label className="text-[11px]">Responsável (ID do usuário)</Label>
                <Input placeholder="ID do usuário" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="mt-2" />
              </div>

              <div>
                <Label className="text-[11px]">Data início (&gt;=)</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-2" />
              </div>

              <div>
                <Label className="text-[11px]">Data término (&lt;=)</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-2" />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Incluir comentários</p>
                  <p className="text-xs text-muted-foreground">Inclui autor e corpo das mensagens</p>
                </div>
                <Switch checked={includeComments} onCheckedChange={setIncludeComments} />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Incluir checklist</p>
                  <p className="text-xs text-muted-foreground">Inclui itens e status (feito/não feito)</p>
                </div>
                <Switch checked={includeChecklist} onCheckedChange={setIncludeChecklist} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">Fechar</Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? 'Gerando...' : 'Exportar para Excel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
