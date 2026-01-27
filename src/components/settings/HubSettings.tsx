"use client"

import React, { useMemo, useState } from 'react'
import { HUB_META, type HubId, resolveHubId } from '@/components/layout/hub-config'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useRouter, usePathname } from 'next/navigation'
export function HubSettings() {
  const { preferences, loading, updatePreferences, mutatePreferences } = useUserPreferences()
  const [saving, setSaving] = useState(false)

  const enabledHubs = preferences?.enabledHubs || Object.keys(HUB_META) as HubId[]

  const [localSelection, setLocalSelection] = useState<Set<HubId>>(new Set(enabledHubs))
  const { toast } = useToast()
  const [savingSet, setSavingSet] = useState<Set<HubId>>(new Set())

  // update when preferences load
  React.useEffect(() => {
    setLocalSelection(new Set(preferences?.enabledHubs || Object.keys(HUB_META) as HubId[]))
  }, [preferences])

  const hubs = useMemo(() => Object.values(HUB_META), [])

  const router = useRouter()
  const pathname = usePathname()

  const toggle = async (id: HubId) => {
    // compute new array based on current selection
    const currentlyHas = localSelection.has(id)
    const newArr = currentlyHas ? Array.from(localSelection).filter(h => h !== id) : Array.from(new Set([...Array.from(localSelection), id]))

    // optimistic UI locally
    setLocalSelection(new Set(newArr))
    // mutate shared preferences immediately so sidebar updates
    mutatePreferences({ enabledHubs: newArr as HubId[] })

    // mark saving
    setSavingSet((s) => {
      const copy = new Set(s)
      copy.add(id)
      return copy
    })

    try {
      await updatePreferences({ enabledHubs: newArr })

      // If the user just disabled the currently active hub, switch to a valid one
      const currentHub = resolveHubId(pathname)
      if (!newArr.includes(currentHub)) {
        const fallback = newArr[0] || 'finance'
        // update lastActiveHub to fallback and navigate
        await updatePreferences({ lastActiveHub: fallback })
        router.replace(HUB_META[fallback].entryHref)
      }

      toast({ title: 'Configurações salvas', description: `${HUB_META[id].name} ${newArr.includes(id) ? 'ativado' : 'desativado'}` })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Não foi possível salvar as configurações', variant: 'destructive' })
      // rollback optimistic change
      const rollbackArr = currentlyHas ? Array.from(new Set([...Array.from(localSelection), id])) : Array.from(localSelection).filter(h => h !== id)
      setLocalSelection(new Set(rollbackArr))
      mutatePreferences({ enabledHubs: rollbackArr as HubId[] })
    } finally {
      setSavingSet((s) => {
        const copy = new Set(s)
        copy.delete(id)
        return copy
      })
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hubs.map((hub) => {
        const enabled = localSelection.has(hub.id)
        return (
          <div key={hub.id} className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-shadow ${enabled ? 'shadow-lg ring-1 ring-offset-1' : ''} dark:bg-gray-800 dark:border-gray-700`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${enabled ? `bg-gradient-to-br ${hub.accent}` : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'}`}>
                <hub.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{hub.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{hub.tagline}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={() => toggle(hub.id)} disabled={savingSet.has(hub.id)} />
              <span className="text-xs text-gray-500">{enabled ? 'Ativado' : 'Desativado'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
