import { MainLayout } from '@/components/layout/main-layout'
import { Dashboard } from '@/components/dashboard/dashboard'
import { InitialHubRedirect } from '@/components/layout/initial-hub-redirect'

export default function HomePage() {
  return (
    <MainLayout>
      <InitialHubRedirect />
      <Dashboard />
    </MainLayout>
  )
}

