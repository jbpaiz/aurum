import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import type { UserPreferences, UserPreferencesInput } from '@/types/preferences'

const PREFERENCES_TABLE = 'user_preferences'

// Função helper para converter snake_case do banco para camelCase
function mapDbToPreferences(data: any): UserPreferences {
  return {
    id: data.id,
    userId: data.user_id,
    theme: data.theme,
    lastActiveHub: data.last_active_hub,
    tasksViewMode: data.tasks_view_mode,
    tasksAdaptiveWidth: data.tasks_adaptive_width,
    tasksAdaptiveWidthList: data.tasks_adaptive_width_list,
    activeProjectId: data.active_project_id,
    activeBoardId: data.active_board_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Função helper para converter camelCase para snake_case do banco
function mapPreferencesToDb(preferences: UserPreferencesInput): Record<string, any> {
  const mapped: Record<string, any> = {}
  
  if (preferences.theme !== undefined) mapped.theme = preferences.theme
  if (preferences.lastActiveHub !== undefined) mapped.last_active_hub = preferences.lastActiveHub
  if (preferences.tasksViewMode !== undefined) mapped.tasks_view_mode = preferences.tasksViewMode
  if (preferences.tasksAdaptiveWidth !== undefined) mapped.tasks_adaptive_width = preferences.tasksAdaptiveWidth
  if (preferences.tasksAdaptiveWidthList !== undefined) mapped.tasks_adaptive_width_list = preferences.tasksAdaptiveWidthList
  if (preferences.activeProjectId !== undefined) mapped.active_project_id = preferences.activeProjectId
  if (preferences.activeBoardId !== undefined) mapped.active_board_id = preferences.activeBoardId
  
  return mapped
}

export function useUserPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  // Criar preferências padrão (com migração do localStorage)
  const createDefaultPreferences = useCallback(async () => {
    if (!user) return

    // Tentar migrar do localStorage
    const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const localHub = localStorage.getItem('aurum.lastActiveHub') as 'finance' | 'tasks' | null
    const localViewMode = localStorage.getItem('aurum.tasks.viewMode') as 'kanban' | 'list' | 'metrics' | null
    const localAdaptiveWidth = localStorage.getItem('aurum.tasks.adaptiveWidth') === 'true'
    const localAdaptiveWidthList = localStorage.getItem('aurum.tasks.adaptiveWidthList') === 'true'
    const localActiveProjectId = localStorage.getItem('aurum.tasks.activeProjectId') || undefined
    const localActiveBoardId = localStorage.getItem('aurum.tasks.activeBoardId') || undefined

    const defaultPrefs = {
      user_id: user.id,
      theme: localTheme || 'system',
      last_active_hub: localHub || 'finance',
      tasks_view_mode: localViewMode || 'kanban',
      tasks_adaptive_width: localAdaptiveWidth,
      tasks_adaptive_width_list: localAdaptiveWidthList,
      active_project_id: localActiveProjectId,
      active_board_id: localActiveBoardId,
    }

    const { data, error } = await (supabase as any)
      .from(PREFERENCES_TABLE)
      .insert(defaultPrefs)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar preferências padrão:', error)
    } else if (data) {
      setPreferences(mapDbToPreferences(data))
      
      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem('theme')
      localStorage.removeItem('aurum.lastActiveHub')
      localStorage.removeItem('aurum.tasks.viewMode')
      localStorage.removeItem('aurum.tasks.adaptiveWidth')
      localStorage.removeItem('aurum.tasks.adaptiveWidthList')
      localStorage.removeItem('aurum.tasks.activeProjectId')
      localStorage.removeItem('aurum.tasks.activeBoardId')
    }
  }, [user])

  // Carregar preferências do usuário
  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null)
      setLoading(false)
      return
    }

    console.log('🔵 [PREFERENCES] Carregando preferências do usuário:', user.id)

    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from(PREFERENCES_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() // Use maybeSingle em vez de single para não dar erro se não existir

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [PREFERENCES] Erro ao carregar:', error)
        setLoading(false)
        return
      }

      if (!data) {
        console.log('🟡 [PREFERENCES] Preferências não encontradas, criando...')
        // Se não existir preferências, criar automaticamente
        await createDefaultPreferences()
      } else {
        const mapped = mapDbToPreferences(data)
        console.log('✅ [PREFERENCES] Carregadas com sucesso:', {
          activeBoardId: mapped.activeBoardId,
          activeProjectId: mapped.activeProjectId,
          lastActiveHub: mapped.lastActiveHub,
          tasksViewMode: mapped.tasksViewMode
        })
        setPreferences(mapped)
      }
    } catch (error) {
      console.error('❌ [PREFERENCES] Exceção ao carregar:', error)
    } finally {
      setLoading(false)
    }
  }, [user, createDefaultPreferences])

  // Atualizar preferências
  const updatePreferences = useCallback(
    async (updates: UserPreferencesInput) => {
      if (!user) return

      console.log('💾 [PREFERENCES] Atualizando preferências:', updates)

      try {
        const dbUpdates = mapPreferencesToDb(updates)
        console.log('💾 [PREFERENCES] Dados mapeados para DB:', dbUpdates)

        const { data, error } = await (supabase as any)
          .from(PREFERENCES_TABLE)
          .update(dbUpdates)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('❌ [PREFERENCES] Erro ao atualizar:', error)
          return
        }

        if (data) {
          console.log('✅ [PREFERENCES] Atualizado com sucesso:', mapDbToPreferences(data))
          setPreferences(mapDbToPreferences(data))
        }
      } catch (error) {
        console.error('❌ [PREFERENCES] Exceção ao atualizar:', error)
      }
    },
    [user]
  )

  // Carregar preferências quando o usuário fizer login
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    loading,
    updatePreferences,
    reloadPreferences: loadPreferences,
  }
}
