'use client'

import { useState } from 'react'
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
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    active: true
  },
  {
    title: 'Transações',
    icon: ArrowUpDown,
    href: '/transactions',
    active: false
  },
  {
    title: 'Contas',
    icon: Wallet,
    href: '/accounts',
    active: false
  },
  {
    title: 'Cartões',
    icon: CreditCard,
    href: '/cards',
    active: false
  },
  {
    title: 'Relatórios',
    icon: PieChart,
    href: '/reports',
    active: false
  },
  {
    title: 'Metas',
    icon: Target,
    href: '/goals',
    active: false
  },
  {
    title: 'Planejamento',
    icon: Calendar,
    href: '/planning',
    active: false
  }
]

const bottomMenuItems = [
  {
    title: 'Notificações',
    icon: Bell,
    href: '/notifications',
    active: false
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/settings',
    active: false
  },
  {
    title: 'Perfil',
    icon: User,
    href: '/profile',
    active: false
  }
]

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
              <p className="text-xs text-gray-500">Controle Financeiro</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col justify-between px-3">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      item.active
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )} />
                    {item.title}
                  </a>
                )
              })}
            </nav>

            <nav className="space-y-1 pb-4">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      item.active
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 transition-colors',
                      item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )} />
                    {item.title}
                  </a>
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
                <p className="text-xs text-gray-500">Controle Financeiro</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between px-3">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                        item.active
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 transition-colors',
                        item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      )} />
                      {item.title}
                    </a>
                  )
                })}
              </nav>

              <nav className="space-y-1 pb-4">
                {bottomMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                        item.active
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 transition-colors',
                        item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      )} />
                      {item.title}
                    </a>
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
