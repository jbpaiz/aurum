'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  ArrowUpDown, 
  PieChart, 
  Settings, 
  User,
  Menu,
  X,
  Home,
  TrendingUp,
  Receipt,
  Target,
  Calendar,
  Bell,
  Banknote,
  Kanban,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  children: React.ReactNode
}

const financeMenuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/'
  },
  {
    title: 'Transações',
    icon: ArrowUpDown,
    href: '/transactions'
  },
  {
    title: 'Contas',
    icon: Wallet,
    href: '/accounts'
  },
  {
    title: 'Formas de Pagamento',
    icon: Banknote,
    href: '/payment-methods'
  },
  {
    title: 'Cartões',
    icon: CreditCard,
    href: '/cards'
  },
  {
    title: 'Relatórios',
    icon: PieChart,
    href: '/reports'
  },
  {
    title: 'Metas',
    icon: Target,
    href: '/goals'
  },
  {
    title: 'Planejamento',
    icon: Calendar,
    href: '/planning'
  }
]

const tasksMenuItems = [
  {
    title: 'Quadro Kanban',
    icon: Kanban,
    href: '/tasks'
  }
]

const hubConfigs = {
  finance: {
    id: 'finance',
    name: 'Financeiro',
    description: 'Dashboard, contas e relatórios',
    tagline: 'Controle Financeiro',
    accent: 'from-blue-600 to-purple-600',
    icon: DollarSign,
    entryHref: '/',
    menu: financeMenuItems
  },
  tasks: {
    id: 'tasks',
    name: 'Tarefas',
    description: 'Kanban e planejamento ágil',
    tagline: 'Produtividade e Projetos',
    accent: 'from-purple-600 to-pink-500',
    icon: Kanban,
    entryHref: '/tasks',
    menu: tasksMenuItems
  }
} as const

type HubId = keyof typeof hubConfigs

const bottomMenuItems = [
  {
    title: 'Notificações',
    icon: Bell,
    href: '/notifications'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/settings'
  },
  {
    title: 'Perfil',
    icon: User,
    href: '/profile'
  }
]

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const currentHub: HubId = pathname.startsWith('/tasks') ? 'tasks' : 'finance'
  const activeHub = hubConfigs[currentHub]
  const hubEntries = Object.values(hubConfigs)
  const currentMenuItems = activeHub.menu

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 pb-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aurum
              </h1>
              <p className="text-xs text-gray-500">{activeHub.tagline}</p>
            </div>
          </div>

          {/* Hub selector */}
          <div className="px-4 pb-4 space-y-2">
            <div className="text-xs font-semibold uppercase text-gray-400">Hubs Aurum</div>
            <div className="space-y-2">
              {hubEntries.map((hub) => {
                const Icon = hub.icon
                const isCurrent = hub.id === currentHub
                return (
                  <Link
                    key={hub.id}
                    href={hub.entryHref}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                      isCurrent
                        ? 'border-transparent bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-500/10 ring-2 ring-blue-500/30'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn(
                      'rounded-lg p-2 text-white',
                      `bg-gradient-to-br ${hub.accent}`
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{hub.name}</span>
                      <span className="text-xs text-gray-500">{hub.description}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col justify-between px-3">
            <nav className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400">{activeHub.name}</p>
              {currentMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )} />
                    {item.title}
                  </Link>
                )
              })}
            </nav>

            <nav className="space-y-1 pb-4">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )} />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white shadow-xl">
            <div className="flex items-center gap-3 px-6 pt-8 pb-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Aurum
                </h1>
                <p className="text-xs text-gray-500">{activeHub.tagline}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between px-3">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-gray-400">Hubs Aurum</div>
                  {hubEntries.map((hub) => {
                    const Icon = hub.icon
                    const isCurrent = hub.id === currentHub
                    return (
                      <Link
                        key={hub.id}
                        href={hub.entryHref}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                          isCurrent
                            ? 'border-transparent bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-500/10 ring-2 ring-blue-500/30'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className={cn(
                          'rounded-lg p-2 text-white',
                          `bg-gradient-to-br ${hub.accent}`
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{hub.name}</span>
                          <span className="text-xs text-gray-500">{hub.description}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                <nav className="space-y-1">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400">{activeHub.name}</p>
                  {currentMenuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                          active
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className={cn(
                          'h-5 w-5 transition-colors',
                          active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        )} />
                        {item.title}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <nav className="space-y-1 pb-4">
                {bottomMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                        active
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 transition-colors',
                        active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      )} />
                      {item.title}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
