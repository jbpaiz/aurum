import { MainLayout } from '@/components/layout/main-layout'
import dynamic from 'next/dynamic'

const HubSettings = dynamic(() => import('@/components/settings/HubSettings').then(m => m.HubSettings), { ssr: false })

export default function Settings() {
  return (
    <MainLayout>
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie as configurações da sua conta</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Hubs</h3>
          <p className="text-sm text-gray-500 mb-6">Selecione quais hubs você deseja ativar no menu lateral e na navegação principal.</p>

          <div className="mt-4">
            <HubSettings />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
