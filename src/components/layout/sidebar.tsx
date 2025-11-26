'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
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
  Banknote,
  Kanban,
  ChevronDown,
  Columns2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HUB_META, resolveHubId, type HubId } from '@/components/layout/hub-config'

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

const hubNavigation = {
  finance: {
    ...HUB_META.finance,
    menu: financeMenuItems
  },
  tasks: {
    ...HUB_META.tasks,
    menu: tasksMenuItems
  }
} as const

const bottomMenuItems: NavigationItem[] = [
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
  const [isHubSwitcherOpen, setIsHubSwitcherOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentHub: HubId = resolveHubId(pathname)
  const activeHub = hubNavigation[currentHub]
  const hubEntries = Object.values(hubNavigation)
  const currentMenuItems = activeHub.menu
  const HubIcon = activeHub.icon

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
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white shadow-sm">
          {/* Brand + Hub selector */}
          <div className="relative px-4 pb-4">
            <button
              type="button"
              onClick={() => setIsHubSwitcherOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <HubIcon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">Hub ativo</p>
                  <p className="text-base font-semibold text-gray-900">{activeHub.name}</p>
                </div>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-gray-500 transition', isHubSwitcherOpen ? 'rotate-180' : '')} />
            </button>

            {isHubSwitcherOpen && (
              <div className="absolute inset-x-4 top-full z-20 mt-3 rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Hubs Aurum
                </div>
                <div className="pb-3">
                  {hubEntries.map((hub) => {
                    const Icon = hub.icon
                    const isCurrent = hub.id === currentHub
                    return (
                      <Link
                        key={hub.id}
                        href={hub.entryHref}
                        onClick={() => setIsHubSwitcherOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50',
                          isCurrent ? 'bg-blue-50 text-blue-900' : 'text-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl',
                            isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{hub.name}</span>
                          <span className="text-xs text-slate-500">{hub.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col justify-between px-3">
            <nav className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400">{activeHub.name}</p>
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
                const active = isActive(item)
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

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white shadow-xl">
            <div className="flex items-center gap-3 px-6 pt-8 pb-4">
              <div className={`rounded-lg bg-gradient-to-br ${activeHub.accent} p-2 text-white`}>
                <HubIcon className="h-6 w-6" />
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
                  <div className="rounded-2xl border border-gray-200 bg-white">
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
                              ? 'bg-blue-50 text-blue-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="flex flex-col">
                            <span>{hub.name}</span>
                            <span className="text-xs text-gray-500">{hub.description}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <nav className="space-y-1">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase text-gray-400">{activeHub.name}</p>
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
                  const active = isActive(item)
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
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="md:hidden border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
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
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Hub ativo</p>
                <p className="text-sm font-semibold text-gray-900">{activeHub.name}</p>
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
