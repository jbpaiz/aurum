'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeightCard } from './weight-card'
import { WeightChart } from './weight-chart'
import { ActivityCard } from './activity-card'
import { ActivityChart } from './activity-chart'
import { SleepCard } from './sleep-card'
import { SleepChart } from './sleep-chart'
import { BodyMeasurementsCard } from './body-measurements-card'
import { BodyMeasurementsChart } from './body-measurements-chart'
import { HydrationCard } from './hydration-card'
import { HydrationChart } from './hydration-chart'
import { HydrationQuickAdd } from './hydration-quick-add'
import { MealCard } from './meal-card'
import { MacroBreakdownChart } from './macro-breakdown-chart'
import { MealHistory } from './meal-history'
import { DailyNutritionSummary } from './daily-nutrition-summary'
import { PointsDisplay } from './points-display'
import { AchievementsCard } from './achievements-card'
import { ChallengesCard } from './challenges-card'
import { GoalsCard } from './goals-card'
import { InsightsCard } from './insights-card'
import { StatsSummary } from './stats-summary'
import { WeightLogModal } from './weight-log-modal'
import { ActivityModal } from './activity-modal'
import { SleepLogModal } from './sleep-log-modal'
import { BodyMeasurementsModal } from './body-measurements-modal'
import { HydrationLogModal } from './hydration-log-modal'
import { HydrationGoalModal } from './hydration-goal-modal'
import { MealModal } from './meal-modal'
import { NutritionGoalsModal } from './nutrition-goals-modal'
import { GoalModal } from './goal-modal'
import type { WeightLog, Activity, SleepLog, BodyMeasurement, HydrationLog, Meal } from '@/types/health'

export function HealthDashboard() {
  const { loading, insights } = useHealth()
  const [activeTab, setActiveTab] = useState('overview')
  const [weightModalOpen, setWeightModalOpen] = useState(false)
  const [editingWeightLog, setEditingWeightLog] = useState<WeightLog | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [sleepModalOpen, setSleepModalOpen] = useState(false)
  const [editingSleep, setEditingSleep] = useState<SleepLog | null>(null)
  const [measurementsModalOpen, setMeasurementsModalOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null)
  const [hydrationModalOpen, setHydrationModalOpen] = useState(false)
  const [editingHydration, setEditingHydration] = useState<HydrationLog | null>(null)
  const [hydrationGoalModalOpen, setHydrationGoalModalOpen] = useState(false)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [nutritionGoalsModalOpen, setNutritionGoalsModalOpen] = useState(false)
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setActivityModalOpen(true)
  }

  const handleCloseActivityModal = (open: boolean) => {
    setActivityModalOpen(open)
    if (!open) {
      setEditingActivity(null)
    }
  }

  const handleEditSleep = (log: SleepLog) => {
    setEditingSleep(log)
    setSleepModalOpen(true)
  }

  const handleCloseSleepModal = (open: boolean) => {
    setSleepModalOpen(open)
    if (!open) {
      setEditingSleep(null)
    }
  }

  const handleEditMeasurement = (measurement: BodyMeasurement) => {
    setEditingMeasurement(measurement)
    setMeasurementsModalOpen(true)
  }

  const handleCloseMeasurementsModal = () => {
    setMeasurementsModalOpen(false)
    setEditingMeasurement(null)
  }

  const handleEditHydration = (log: HydrationLog) => {
    setEditingHydration(log)
    setHydrationModalOpen(true)
  }

  const handleCloseHydrationModal = () => {
    setHydrationModalOpen(false)
    setEditingHydration(null)
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setMealModalOpen(true)
  }

  const handleCloseMealModal = () => {
    setMealModalOpen(false)
    setEditingMeal(null)
  }

  const weightInsights = insights.filter((insight) => insight.type === 'weight')
  const activityInsights = insights.filter((insight) => insight.type === 'activity')
  const sleepInsights = insights.filter((insight) => insight.type === 'sleep')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory md:overflow-visible">
            <TabsList className="flex h-auto w-full flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/70 p-1 md:grid md:w-full md:grid-cols-8 md:gap-2 md:p-2">
              <TabsTrigger value="overview" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Visão Geral</TabsTrigger>
              <TabsTrigger value="weight" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Peso</TabsTrigger>
              <TabsTrigger value="body" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Medidas</TabsTrigger>
              <TabsTrigger value="hydration" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Hidratação</TabsTrigger>
              <TabsTrigger value="nutrition" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Nutrição</TabsTrigger>
              <TabsTrigger value="activity" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Atividades</TabsTrigger>
              <TabsTrigger value="sleep" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Sono</TabsTrigger>
              <TabsTrigger value="gamification" className="whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">Conquistas</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StatsSummary />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <WeightCard onAddClick={() => setWeightModalOpen(true)} />
            <ActivityCard onAddClick={() => setActivityModalOpen(true)} />
            <SleepCard onAddClick={() => setSleepModalOpen(true)} />
          </div>
          <BodyMeasurementsCard 
            onAddClick={() => setMeasurementsModalOpen(true)}
            onEditClick={handleEditMeasurement}
          />
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
          {weightInsights.length > 0 && <InsightsCard insights={weightInsights} />}
          <WeightChart />
          <WeightCard 
            detailed 
            onAddClick={() => setWeightModalOpen(true)}
            onEditClick={handleEditWeight}
          />
        </TabsContent>

        {/* Body Measurements Tab */}
        <TabsContent value="body" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setMeasurementsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Medição
            </Button>
          </div>
          <BodyMeasurementsChart />
          <BodyMeasurementsCard 
            onAddClick={() => setMeasurementsModalOpen(true)}
            onEditClick={handleEditMeasurement}
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
          {activityInsights.length > 0 && <InsightsCard insights={activityInsights} />}
          <ActivityChart />
          <ActivityCard 
            detailed 
            onAddClick={() => setActivityModalOpen(true)}
            onEditClick={handleEditActivity}
          />
        </TabsContent>

        {/* Sleep Tab */}
        <TabsContent value="sleep" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setSleepModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Sono
            </Button>
          </div>
          {sleepInsights.length > 0 && <InsightsCard insights={sleepInsights} />}
          <SleepChart />
          <SleepCard 
            detailed 
            onAddClick={() => setSleepModalOpen(true)}
            onEditClick={handleEditSleep}
          />
        </TabsContent>

        {/* Hydration Tab */}
        <TabsContent value="hydration" className="space-y-6">
          <div className="flex flex-col gap-6">
            <HydrationQuickAdd onCustomClick={() => setHydrationModalOpen(true)} />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setHydrationGoalModalOpen(true)}>
                Definir Meta
              </Button>
            </div>
            <HydrationChart />
            <HydrationCard 
              detailed 
              onAddClick={() => setHydrationModalOpen(true)}
              onEditClick={handleEditHydration}
              onGoalClick={() => setHydrationGoalModalOpen(true)}
            />
          </div>
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setMealModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Refeição
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <DailyNutritionSummary 
              onGoalClick={() => setNutritionGoalsModalOpen(true)}
              onAddMealClick={() => setMealModalOpen(true)}
            />
            <MacroBreakdownChart />
          </div>
          <MealCard 
            detailed
            onAddClick={() => setMealModalOpen(true)}
            onEditClick={handleEditMeal}
            onGoalClick={() => setNutritionGoalsModalOpen(true)}
          />
          <MealHistory onEditClick={handleEditMeal} />
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PointsDisplay />
            <AchievementsCard />
          </div>
          <ChallengesCard />
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
        onOpenChange={handleCloseActivityModal}
        editingActivity={editingActivity}
      />
      <SleepLogModal
        open={sleepModalOpen}
        onOpenChange={handleCloseSleepModal}
        editingSleep={editingSleep}
      />
      <BodyMeasurementsModal
        open={measurementsModalOpen}
        onClose={handleCloseMeasurementsModal}
        editing={editingMeasurement}
      />
      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
      />
      <HydrationLogModal 
        open={hydrationModalOpen}
        onClose={handleCloseHydrationModal}
        editing={editingHydration}
      />
      <HydrationGoalModal
        open={hydrationGoalModalOpen}
        onClose={() => setHydrationGoalModalOpen(false)}
      />
      <MealModal
        open={mealModalOpen}
        onClose={handleCloseMealModal}
        editing={editingMeal}
      />
      <NutritionGoalsModal
        open={nutritionGoalsModalOpen}
        onClose={() => setNutritionGoalsModalOpen(false)}
      />
    </div>
  )
}
