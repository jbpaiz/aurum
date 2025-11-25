import { MainLayout } from '@/components/layout/main-layout'
import { TasksProvider } from '@/contexts/tasks-context'
import { KanbanView } from '@/components/tasks/kanban-view'

export default function TasksPage() {
  return (
    <MainLayout>
      <TasksProvider>
        <KanbanView />
      </TasksProvider>
    </MainLayout>
  )
}
