'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import type { ReadonlyURLSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
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
  Target,
  Calendar,
  Bell,
  Kanban,
  ChevronDown,
  Columns2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HUB_META, resolveHubId, type HubId } from '@/components/layout/hub-config'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  children: React.ReactNode
}

interface NavigationItem {
  title: string
  icon: LucideIcon
  href: string
  isActive?: (pathname: string, searchParams: ReadonlyURLSearchParams) => boolean
}

const financeMenuItems: NavigationItem[] = [
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

const tasksMenuItems: NavigationItem[] = [
  {
    title: 'Quadro Kanban',
    icon: Kanban,
    href: '/tasks',
    isActive: (pathname, searchParams) => pathname.startsWith('/tasks') && searchParams.get('manager') !== '1'
  },
  {
    title: 'Gerenciar quadros',
    icon: Columns2,
    href: '/tasks?manager=1',
    isActive: (pathname, searchParams) => pathname.startsWith('/tasks') && searchParams.get('manager') === '1'
  }
]

const healthMenuItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/health'
  }
]

const hubNavigation = {
  finance: {
    ...HUB_META.finance,
    menu: financeMenuItems
  },
  tasks: {
    ...HUB_META.tasks,
    menu: tasksMenuItems
  },
  health: {
    ...HUB_META.health,
    menu: healthMenuItems
  }
} as const

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHubSwitcherOpen, setIsHubSwitcherOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isManualNavigation = useRef(false)
  const currentHub: HubId = resolveHubId(pathname)
  const activeHub = hubNavigation[currentHub]
  const hubEntries = Object.values(hubNavigation)
  const currentMenuItems = activeHub.menu
  const HubIcon = activeHub.icon
  const { preferences, updatePreferences } = useUserPreferences()

  // Salvar último hub acessado no banco com debounce
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Debounce de 500ms para evitar race conditions
    const timer = setTimeout(() => {
      if (preferences && preferences.lastActiveHub !== currentHub) {
        updatePreferences({ lastActiveHub: currentHub })
      }
      // Sempre mantém localStorage sincronizado como backup
      localStorage.setItem('aurum.lastActiveHub', currentHub)
      
      // Limpa flag de navegação manual
      if (isManualNavigation.current) {
        isManualNavigation.current = false
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [currentHub, preferences, updatePreferences])

  const isActive = (item: NavigationItem) => {
    if (item.isActive) {
      return item.isActive(pathname, searchParams)
    }

    const [targetPath] = item.href.split(/[?#]/)
    if (targetPath === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(targetPath)
  }

  useEffect(() => {
    setIsHubSwitcherOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col h-screen">
        <div className="flex flex-col h-full bg-white shadow-sm dark:bg-gray-900 dark:shadow-gray-800/50">
          {/* Brand + Hub selector */}
          <div className="flex-shrink-0 relative px-4 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsHubSwitcherOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${activeHub.accent} text-white`}>
                  <HubIcon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Hub ativo</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{activeHub.name}</p>
                </div>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-gray-500 transition dark:text-gray-400', isHubSwitcherOpen ? 'rotate-180' : '')} />
            </button>

            {isHubSwitcherOpen && (
              <div className="absolute inset-x-4 top-full z-20 mt-3 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/50">
                <div className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                  Hubs Aurum
                </div>
                <div className="pb-3">
                  {hubEntries.map((hub) => {
                    const Icon = hub.icon
                    const isCurrent = hub.id === currentHub
                    return (
                      <button
                        key={hub.id}
                        onClick={(e) => {
                          e.preventDefault()
                          setIsHubSwitcherOpen(false)
                          if (!isCurrent) {
                            isManualNavigation.current = true
                            // Marca como navegação interna para evitar redirecionamento automático
                            sessionStorage.setItem('aurum.internalNavigation', 'true')
                            router.push(hub.entryHref)
                          }
                        }}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-gray-700 w-full text-left',
                          isCurrent ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl',
                            isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{hub.name}</span>
                          <span className="text-xs text-slate-500 dark:text-gray-400">{hub.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation - com scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{activeHub.name}</p>
              {currentMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 dark:border-blue-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                    )} />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Controls Section */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-3 py-4">
            <div className="flex items-center gap-2">
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400">
                    <Bell className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-gray-400">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <ThemeToggle />
                <div className="flex-1" />
                <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white shadow-xl dark:bg-gray-900 dark:shadow-gray-950/50">
            <div className="flex items-center gap-3 px-6 pt-8 pb-4">
              <div className={`rounded-lg bg-gradient-to-br ${activeHub.accent} p-2 text-white`}>
                <HubIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Aurum
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeHub.tagline}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between px-3">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Hubs Aurum</div>
                  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    {hubEntries.map((hub) => {
                      const Icon = hub.icon
                      const isCurrent = hub.id === currentHub
                      return (
                        <Link
                          key={hub.id}
                          href={hub.entryHref}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 text-sm font-medium transition',
                            isCurrent
                              ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="flex flex-col">
                            <span>{hub.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{hub.description}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <nav className="space-y-1">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{activeHub.name}</p>
                  {currentMenuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item)
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                          active
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 dark:border-blue-400'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                        )}
                      >
                        <Icon className={cn(
                          'h-5 w-5 transition-colors',
                          active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                        )} />
                        {item.title}
                      </Link>
                    )
                  })}
                </nav>

                {/* User controls no mobile */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                    <UserMenu />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="flex-shrink-0 md:hidden border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-900/50"
              aria-label="Abrir menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', activeHub.accent)}>
                <HubIcon className="h-5 w-5" />
              </span>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Hub ativo</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeHub.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
