'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/auth/auth-modal'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { HUB_META } from '@/components/layout/hub-config'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading: authLoading } = useAuth()
  const { preferences, loading: preferencesLoading } = useUserPreferences()
  const router = useRouter()
  const pathname = usePathname()

  // Redirecionar para o último hub acessado após login
  useEffect(() => {
    if (!user || authLoading || preferencesLoading) return
    
    // Só redireciona se estiver na página inicial (/)
    if (pathname === '/') {
      let lastHub = preferences?.lastActiveHub
      
      // Fallback para localStorage se não houver preferências no banco
      if (!lastHub) {
        lastHub = localStorage.getItem('aurum.lastActiveHub') as 'finance' | 'tasks' | null
      }
      
      if (lastHub && lastHub !== 'finance' && HUB_META[lastHub]) {
        router.replace(HUB_META[lastHub].entryHref)
      }
    }
  }, [user, authLoading, preferences, preferencesLoading, pathname, router])

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
      <div className="min-h-screen bg-slate-950">
        <AuthModal showCloseButton={false} />
      </div>
    )
  }

  return (
    <Sidebar>
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </Sidebar>
  )
}
