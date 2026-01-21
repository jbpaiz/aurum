'use client'

import { useRef, useState, useEffect } from 'react'
import { Plus, Home, LineChart, Ruler, Droplets, UtensilsCrossed, Dumbbell, Moon, Medal } from 'lucide-react'
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
import { useUserPreferences } from '@/hooks/use-user-preferences'
import type { WeightLog, Activity, SleepLog, BodyMeasurement, HydrationLog, Meal } from '@/types/health'

export function HealthDashboard() {
  const { loading } = useHealth()
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
  const tabsListRef = useRef<HTMLDivElement | null>(null)

  const { preferences, loading: preferencesLoading } = useUserPreferences()
  const showWeight = preferences?.showWeight ?? true
  const showBody = preferences?.showBody ?? true
  const showHydration = preferences?.showHydration ?? true
  const showNutrition = preferences?.showNutrition ?? true
  const showActivity = preferences?.showActivity ?? true
  const showSleep = preferences?.showSleep ?? true
  const showGoals = preferences?.showGoals ?? true
  const showAchievements = preferences?.showAchievements ?? true

  // Garantir que, se o usuário desativar uma seção, não permaneça com a tab ativa daquela seção
  useEffect(() => {
    if (!preferencesLoading && preferences) {
      if (activeTab === 'nutrition' && !preferences.showNutrition) setActiveTab('overview')
      if (activeTab === 'gamification' && !preferences.showAchievements) setActiveTab('overview')
      if (activeTab === 'weight' && !preferences.showWeight) setActiveTab('overview')
      if (activeTab === 'body' && !preferences.showBody) setActiveTab('overview')
      if (activeTab === 'hydration' && !preferences.showHydration) setActiveTab('overview')
      if (activeTab === 'activity' && !preferences.showActivity) setActiveTab('overview')
      if (activeTab === 'sleep' && !preferences.showSleep) setActiveTab('overview')
    }
  }, [preferences, preferencesLoading, activeTab])

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsListRef.current
    if (!el) return
    const delta = direction === 'left' ? -el.clientWidth : el.clientWidth
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

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
          <div className="relative w-full">
            <div ref={tabsListRef} className="w-full overflow-x-auto touch-pan-x scrollbar-hide scroll-smooth snap-x snap-mandatory px-4 md:overflow-visible md:px-0">
              <TabsList className="flex h-auto w-full min-w-max flex-nowrap items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-1 py-2 md:grid md:min-w-full md:w-full md:grid-cols-8 md:gap-2 md:p-2">
                <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <Home className="h-4 w-4" aria-hidden />
                  <span>Visão Geral</span>
                </TabsTrigger>
                {showWeight && (
                  <TabsTrigger value="weight" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <LineChart className="h-4 w-4" aria-hidden />
                    <span>Peso</span>
                  </TabsTrigger>
                )}
                {showBody && (
                  <TabsTrigger value="body" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <Ruler className="h-4 w-4" aria-hidden />
                    <span>Medidas</span>
                  </TabsTrigger>
                )}
                {showHydration && (
                  <TabsTrigger value="hydration" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <Droplets className="h-4 w-4" aria-hidden />
                    <span>Hidratação</span>
                  </TabsTrigger>
                )}
                {showNutrition && (
                  <TabsTrigger value="nutrition" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <UtensilsCrossed className="h-4 w-4" aria-hidden />
                    <span>Nutrição</span>
                  </TabsTrigger>
                )}
                {showActivity && (
                  <TabsTrigger value="activity" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <Dumbbell className="h-4 w-4" aria-hidden />
                    <span>Atividades</span>
                  </TabsTrigger>
                )}
                {showSleep && (
                  <TabsTrigger value="sleep" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <Moon className="h-4 w-4" aria-hidden />
                    <span>Sono</span>
                  </TabsTrigger>
                )}
                {showAchievements && (
                  <TabsTrigger value="gamification" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                    <Medal className="h-4 w-4" aria-hidden />
                    <span>Conquistas</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <StatsSummary />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showWeight && <WeightCard onAddClick={() => setWeightModalOpen(true)} />}
            {showActivity && <ActivityCard onAddClick={() => setActivityModalOpen(true)} />}
            {showSleep && <SleepCard onAddClick={() => setSleepModalOpen(true)} />}
          </div>
          {showBody && (
            <BodyMeasurementsCard 
              onAddClick={() => setMeasurementsModalOpen(true)}
              onEditClick={handleEditMeasurement}
            />
          )}
          {showGoals && <GoalsCard onAddClick={() => setGoalModalOpen(true)} />}
        </TabsContent>

        {/* Weight Tab */}
        <TabsContent value="weight" className="space-y-6">
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
        {showNutrition && (
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
        )}

        {/* Gamification Tab */}
        {showAchievements && (
          <TabsContent value="gamification" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <PointsDisplay />
              <AchievementsCard />
            </div>
            <ChallengesCard />
          </TabsContent>
        )}
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
