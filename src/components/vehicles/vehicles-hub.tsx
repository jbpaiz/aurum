'use client'

import { useRef } from 'react'
import { ClipboardList, Fuel, Gavel, Layers, Sparkle, Wrench, BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VehiclesPage } from '@/components/vehicles/vehicles-page'
import { FuelTab } from '@/components/vehicles/fuel-tab'
import { MaintenanceTab } from '@/components/vehicles/maintenance-tab'
import { DocumentsTab } from '@/components/vehicles/documents-tab'
import { FinesTab } from '@/components/vehicles/fines-tab'
import { DriversTab } from '@/components/vehicles/drivers-tab'
import { ReportsTab } from '@/components/vehicles/reports-tab'

export function VehiclesHub() {
  const tabsListRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-1 sm:p-5 md:p-6 space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Frota</p>
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Veículos e mobilidade</h1>
            <p className="text-gray-600 dark:text-gray-400">Cadastro, manutenção, abastecimento, documentos e multas em um só lugar.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="cadastro" className="space-y-4">
        <div className="w-full">
          <div className="relative w-full">
            <div
              ref={tabsListRef}
              className="w-full overflow-x-auto touch-pan-x scrollbar-hide scroll-smooth snap-x snap-mandatory px-4 md:overflow-visible md:px-0"
            >
              <TabsList className="flex h-auto w-full min-w-max flex-nowrap items-center gap-2 rounded-md md:rounded-lg border border-border/60 bg-background/70 px-1 py-2 md:grid md:min-w-full md:w-full md:grid-cols-7 md:gap-2 md:p-2">
                <TabsTrigger value="cadastro" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <ClipboardList className="h-4 w-4" />
                  <span>Cadastro</span>
                </TabsTrigger>
                <TabsTrigger value="manutencao" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <Wrench className="h-4 w-4" />
                  <span>Manutenção & compliance</span>
                </TabsTrigger>
                <TabsTrigger value="abastecimento" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <Fuel className="h-4 w-4" />
                  <span>Abastecimento & custos</span>
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <Sparkle className="h-4 w-4" />
                  <span>Documentos & anexos</span>
                </TabsTrigger>
                <TabsTrigger value="multas" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <Gavel className="h-4 w-4" />
                  <span>Multas</span>
                </TabsTrigger>
                <TabsTrigger value="condutores" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <ClipboardList className="h-4 w-4" />
                  <span>Condutores</span>
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="flex items-center gap-2 whitespace-nowrap snap-start h-10 rounded-sm md:rounded-md px-3 text-sm font-medium border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30">
                  <BarChart3 className="h-4 w-4" />
                  <span>Relatórios</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <TabsContent value="cadastro">
          <VehiclesPage />
        </TabsContent>

        <TabsContent value="manutencao">
          <MaintenanceTab />
        </TabsContent>

        <TabsContent value="abastecimento">
          <FuelTab />
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentsTab />
        </TabsContent>

        <TabsContent value="multas">
          <FinesTab />
        </TabsContent>

        <TabsContent value="condutores">
          <DriversTab />
        </TabsContent>

        <TabsContent value="relatorios">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
