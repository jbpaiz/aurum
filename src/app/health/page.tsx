import { MainLayout } from '@/components/layout/main-layout'
import { HealthProvider } from '@/contexts/health-context'
import { HealthDashboard } from '@/components/health/health-dashboard'

export default function HealthPage() {
  return (
    <MainLayout>
      <HealthProvider>
        <HealthDashboard />
      </HealthProvider>
    </MainLayout>
  )
}
