import type { LucideIcon } from 'lucide-react'
import { DollarSign, Kanban, Activity, Car, GitBranch } from 'lucide-react'

export type HubId = 'finance' | 'tasks' | 'health' | 'vehicles' | 'flow'

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
  },
  flow: {
    id: 'flow',
    name: 'Flow',
    description: 'Diagramas e fluxos',
    tagline: 'Crie e organize processos e ideias',
    accent: 'from-indigo-600 to-blue-600',
    icon: GitBranch,
    entryHref: '/flow'
  },
  vehicles: {
    id: 'vehicles',
    name: 'Veículos',
    description: 'Frota, manutenção e compliance',
    tagline: 'Mobilidade, custos e documentos',
    accent: 'from-blue-600 to-cyan-500',
    icon: Car,
    entryHref: '/vehicles'
  }
}

export const resolveHubId = (pathname: string | null | undefined): HubId => {
  if (!pathname) {
    // Tentar recuperar o último hub acessado do localStorage
    if (typeof window !== 'undefined') {
      const lastHub = localStorage.getItem('aurum.lastActiveHub') as HubId | null
      if (lastHub === 'finance' || lastHub === 'tasks' || lastHub === 'health' || lastHub === 'vehicles' || lastHub === 'flow') {
        return lastHub
      }
    }
    return 'finance'
  }
  if (pathname.startsWith('/tasks')) return 'tasks'
  if (pathname.startsWith('/health')) return 'health'
  if (pathname.startsWith('/flow')) return 'flow'
  if (pathname.startsWith('/vehicles')) return 'vehicles'
  return 'finance'
} 
