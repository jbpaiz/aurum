"use client"

import React, { useMemo, useState } from 'react'
import { HUB_META, type HubId } from '@/components/layout/hub-config'
import { useUserPreferences } from '@/hooks/use-user-preferences'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export function HubSettings() {
  const { preferences, loading, updatePreferences } = useUserPreferences()
  const [saving, setSaving] = useState(false)

  const enabledHubs = preferences?.enabledHubs || Object.keys(HUB_META) as HubId[]

  const [localSelection, setLocalSelection] = useState<Set<HubId>>(new Set(enabledHubs))

  // update when preferences load
  React.useEffect(() => {
    setLocalSelection(new Set(preferences?.enabledHubs || Object.keys(HUB_META) as HubId[]))
  }, [preferences])

  const hubs = useMemo(() => Object.values(HUB_META), [])

  const toggle = (id: HubId) => {
    setLocalSelection((prev) => {
      const copy = new Set(prev)
      if (copy.has(id)) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const arr = Array.from(localSelection)
      await updatePreferences({ enabledHubs: arr })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const resetDefault = () => {
    const defaults = Object.keys(HUB_META) as HubId[]
    setLocalSelection(new Set(defaults))
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hubs.map((hub) => (
        <div key={hub.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white bg-gradient-to-br ${hub.accent}`}>
              <hub.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{hub.name}</div>
              <div className="text-xs text-gray-500">{hub.tagline}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={localSelection.has(hub.id)} onCheckedChange={() => toggle(hub.id)} />
            <span className="text-xs text-gray-500">{localSelection.has(hub.id) ? 'Ativado' : 'Desativado'}</span>
          </div>
        </div>
      ))}

      <div className="col-span-full flex items-center justify-end gap-3 mt-2">
        <Button variant="outline" size="sm" onClick={resetDefault}>Resetar padrão</Button>
        <Button onClick={save} disabled={saving} size="sm">{saving ? 'Salvando...' : 'Salvar configurações'}</Button>
      </div>
    </div>
  )
}
