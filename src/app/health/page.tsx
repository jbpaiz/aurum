'use client'

import { HealthProvider, useHealth } from '@/contexts/health-context'
import { HealthDashboard } from '@/components/health/health-dashboard'

export default function HealthPage() {
  return (
    <HealthProvider>
      <HealthDashboard />
    </HealthProvider>
  )
}
