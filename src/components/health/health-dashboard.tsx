'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeightCard } from './weight-card'
import { WeightChart } from './weight-chart'
import { ActivityCard } from './activity-card'
import { SleepCard } from './sleep-card'
import { GoalsCard } from './goals-card'
import { InsightsCard } from './insights-card'
import { WeightLogModal } from './weight-log-modal'
import { ActivityModal } from './activity-modal'
import { SleepLogModal } from './sleep-log-modal'
import { GoalModal } from './goal-modal'
import type { WeightLog } from '@/types/health'

export function HealthDashboard() {
  const { loading, insights } = useHealth()
  const [activeTab, setActiveTab] = useState('overview')
  const [weightModalOpen, setWeightModalOpen] = useState(false)
  const [editingWeightLog, setEditingWeightLog] = useState<WeightLog | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [sleepModalOpen, setSleepModalOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)

  const handleEditWeight = (log: WeightLog) => {
    setEditingWeightLog(log)
    setWeightModalOpen(true)
  }

  const handleCloseWeightModal = (open: boolean) => {
    setWeightModalOpen(open)
    if (!open) {
      setEditingWeightLog(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <InsightsCard insights={insights} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="weight">Peso</TabsTrigger>
          <TabsTrigger value="activity">Atividades</TabsTrigger>
          <TabsTrigger value="sleep">Sono</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <WeightCard onAddClick={() => setWeightModalOpen(true)} />
            <ActivityCard onAddClick={() => setActivityModalOpen(true)} />
            <SleepCard onAddClick={() => setSleepModalOpen(true)} />
          </div>
          <GoalsCard onAddClick={() => setGoalModalOpen(true)} />
        </TabsContent>

        {/* Weight Tab */}
        <TabsContent value="weight" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setWeightModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Peso
            </Button>
          </div>
          <WeightChart />
          <WeightCard 
            detailed 
            onAddClick={() => setWeightModalOpen(true)}
            onEditClick={handleEditWeight}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setActivityModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Atividade
            </Button>
          </div>
          <ActivityCard detailed onAddClick={() => setActivityModalOpen(true)} />
        </TabsContent>

        {/* Sleep Tab */}
        <TabsContent value="sleep" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setSleepModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Sono
            </Button>
          </div>
          <SleepCard detailed onAddClick={() => setSleepModalOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <WeightLogModal 
        open={weightModalOpen} 
        onOpenChange={handleCloseWeightModal}
        editingLog={editingWeightLog}
      />
      <ActivityModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
      />
      <SleepLogModal
        open={sleepModalOpen}
        onOpenChange={setSleepModalOpen}
      />
      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
      />
    </div>
  )
}
