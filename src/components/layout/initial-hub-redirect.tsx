'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { HUB_META } from '@/components/layout/hub-config'

// Flag global para controlar se já redirecionou nesta sessão
let hasRedirectedInSession = false

export function InitialHubRedirect() {
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log('🟢 InitialHubRedirect:', { 
      hasRedirectedInSession, 
      user: !!user, 
      pathname,
      isInternalNav: sessionStorage.getItem('aurum.internalNavigation'),
      lastHubPrefs: preferences?.lastActiveHub,
      lastHubLocal: localStorage.getItem('aurum.lastActiveHub')
    })
    
    // Só executa se:
    // 1. Ainda não redirecionou nesta sessão
    // 2. Usuário está logado
    // 3. Está na raiz /
    if (hasRedirectedInSession || !user || pathname !== '/') {
      console.log('⏭️ Pulando redirecionamento:', { hasRedirectedInSession, user: !!user, pathname })
      return
    }
    
    // Verifica se é navegação interna (clique no hub)
    const isInternalNavigation = sessionStorage.getItem('aurum.internalNavigation')
    if (isInternalNavigation) {
      console.log('🔵 Navegação interna detectada, BLOQUEANDO PERMANENTEMENTE')
      hasRedirectedInSession = true // Bloqueia para sempre nesta sessão
      sessionStorage.removeItem('aurum.internalNavigation')
      return
    }
    
    // Prioriza preferências do banco, com fallback para localStorage
    let lastHub = preferences?.lastActiveHub
    
    if (!lastHub) {
      const stored = localStorage.getItem('aurum.lastActiveHub')
      if (stored === 'finance' || stored === 'tasks') {
        lastHub = stored
      }
    }
    
    console.log('🟣 Último hub:', lastHub, 'vai redirecionar?', lastHub && lastHub !== 'finance')
    
    // Redireciona se o último hub não for finance (que é a raiz /)
    if (lastHub && lastHub !== 'finance' && HUB_META[lastHub]) {
      console.log('🚀 REDIRECIONANDO PARA:', HUB_META[lastHub].entryHref)
      hasRedirectedInSession = true
      router.replace(HUB_META[lastHub].entryHref)
    }
  }, [user, preferences, router, pathname])

  return null
}

