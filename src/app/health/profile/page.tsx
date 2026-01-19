import { MainLayout } from '@/components/layout/main-layout'
import { HealthProvider } from '@/contexts/health-context'
import { HealthProfileSettings } from '@/components/health/health-profile-settings'

export default function HealthProfilePage() {
  return (
    <MainLayout>
      <HealthProvider>
        <HealthProfileSettings />
      </HealthProvider>
    </MainLayout>
  )
}
