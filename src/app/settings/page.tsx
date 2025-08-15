import { MainLayout } from '@/components/layout/main-layout'

export default function Settings() {
  return (
    <MainLayout>
      <div className="flex-1 p-6 space-y-6 bg-gray-50">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie as configurações da sua conta</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Configurações em Desenvolvimento
          </h3>
          <p className="text-gray-500">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
