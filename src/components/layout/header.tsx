'use client'

import { usePathname } from 'next/navigation'
import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/user-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { HUB_META, resolveHubId } from '@/components/layout/hub-config'

export function Header() {
  const pathname = usePathname()
  const hubId = resolveHubId(pathname)
  const hub = HUB_META[hubId]
  const HubIcon = hub.icon

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur px-4 py-3 shadow-sm sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800 order-1 sm:order-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <UserMenu />
        </div>

        <div className="flex items-center gap-3 order-2 sm:order-1">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${hub.accent}`}>
            <HubIcon className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Hub ativo</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{hub.name}</h2>
            <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">{hub.tagline}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
