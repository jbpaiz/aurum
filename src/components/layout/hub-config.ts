import type { LucideIcon } from 'lucide-react'
import { DollarSign, Kanban } from 'lucide-react'

export type HubId = 'finance' | 'tasks'

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
  }
}

export const resolveHubId = (pathname: string | null | undefined): HubId => {
  if (!pathname) return 'finance'
  return pathname.startsWith('/tasks') ? 'tasks' : 'finance'
}
