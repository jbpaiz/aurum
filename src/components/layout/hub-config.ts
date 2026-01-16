import type { LucideIcon } from 'lucide-react'
import { DollarSign, Kanban, Activity } from 'lucide-react'

export type HubId = 'finance' | 'tasks' | 'health'

export interface HubMeta {
  id: HubId
  name: string
  description: string
  tagline: string
  accent: string
  icon: LucideIcon
  entryHref: string
}

export const HUB_META: Record<HubId, HubMeta> = {
  finance: {
    id: 'finance',
    name: 'Financeiro',
    description: 'Dashboard, contas e relatórios',
    tagline: 'Controle financeiro em tempo real',
    accent: 'from-blue-600 to-purple-600',
    icon: DollarSign,
    entryHref: '/'
  },
  tasks: {
    id: 'tasks',
    name: 'Tarefas',
    description: 'Kanban e planejamento ágil',
    tagline: 'Produtividade e projetos integrados',
    accent: 'from-purple-600 to-pink-500',
    icon: Kanban,
    entryHref: '/tasks'
  },
  health: {
    id: 'health',
    name: 'Saúde',
    description: 'Peso, atividades e sono',
    tagline: 'Acompanhe seu bem-estar',
    accent: 'from-green-600 to-teal-500',
    icon: Activity,
    entryHref: '/health'
  }
}

export const resolveHubId = (pathname: string | null | undefined): HubId => {
  if (!pathname) {
    // Tentar recuperar o último hub acessado do localStorage
    if (typeof window !== 'undefined') {
      const lastHub = localStorage.getItem('aurum.lastActiveHub') as HubId | null
      if (lastHub === 'finance' || lastHub === 'tasks' || lastHub === 'health') {
        return lastHub
      }
    }
    return 'finance'
  }
  if (pathname.startsWith('/tasks')) return 'tasks'
  if (pathname.startsWith('/health')) return 'health'
  return 'finance'
}
