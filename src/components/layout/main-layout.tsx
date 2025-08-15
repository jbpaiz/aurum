'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/auth/auth-modal'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CalendarDays,
  UserPlus,
  LogIn
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading: authLoading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Welcome Section for Non-Authenticated Users */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="max-w-4xl mx-auto">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bem-vindo ao Aurum
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Seu assistente pessoal para controle financeiro inteligente. 
                Gerencie receitas, despesas e acompanhe seu progresso financeiro com ferramentas modernas.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">Receitas Inteligentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Registre e categorize todas suas fontes de renda com análises automáticas
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">Controle de Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Monitore seus gastos por categoria com insights em tempo real
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CalendarDays className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">Relatórios Avançados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Visualize relatórios detalhados e projeções financeiras personalizadas
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                >
                  <UserPlus className="h-5 w-5" />
                  Criar Conta Grátis
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
                >
                  <LogIn className="h-5 w-5" />
                  Já tenho conta
                </Button>
              </div>

              {/* Features Preview */}
              <div className="mt-20 grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-800">🚀 Recursos Principais</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Dashboard interativo com gráficos em tempo real
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Gestão completa de contas e cartões
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Categorização automática de transações
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      Metas financeiras e planejamento
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-800">🔒 Segurança Total</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Autenticação segura com Google e GitHub
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Dados criptografados e protegidos
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      Backup automático na nuvem
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      Acesso seguro multiplataforma
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isAuthModalOpen && (
          <AuthModal
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <Sidebar>
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </Sidebar>
  )
}
