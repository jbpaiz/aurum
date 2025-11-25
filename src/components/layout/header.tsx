'use client'

import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/user-menu'

export function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Workspace</p>
          <h2 className="text-lg font-semibold text-gray-900">Aurum Hub</h2>
        </div>

        <div className="flex items-center gap-1 rounded-2xl bg-gray-50 px-2 py-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
