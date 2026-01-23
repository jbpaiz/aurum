import { MainLayout } from '@/components/layout/main-layout'
import DiagramEditor from '@/components/diagram/DiagramEditor'

export default function FlowPageRoute() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Flow — Diagram Studio</h1>
        <div className="bg-white rounded shadow p-4" style={{ height: '78vh' }}>
          <DiagramEditor />
        </div>
      </div>
    </MainLayout>
  )
}
