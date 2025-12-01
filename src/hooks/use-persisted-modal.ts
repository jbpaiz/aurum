/**
 * Hook para persistir estado de modais e formulários
 * Mantém os dados mesmo ao trocar de aba ou navegar
 */

import { useState, useEffect, useCallback } from 'react'

interface UsePersistedModalOptions<T> {
  key: string // Chave única para identificar o modal/formulário
  defaultValue?: T // Valor padrão dos dados do formulário
}

/**
 * Hook que persiste estado de modal aberto/fechado e dados do formulário
 * 
 * @example
 * const { 
 *   isOpen, 
 *   open, 
 *   close, 
 *   data, 
 *   setData, 
 *   clear 
 * } = usePersistedModal({
 *   key: 'add-card-modal',
 *   defaultValue: { alias: '', provider: '' }
 * })
 */
export function usePersistedModal<T = any>({ 
  key, 
  defaultValue 
}: UsePersistedModalOptions<T>) {
  
  // Chaves de storage
  const storageKeyOpen = `modal_${key}_open`
  const storageKeyData = `modal_${key}_data`

  // Estado do modal (aberto/fechado)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = sessionStorage.getItem(storageKeyOpen)
    return stored === 'true'
  })

  // Dados do formulário
  const [data, setDataInternal] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue as T
    
    const stored = sessionStorage.getItem(storageKeyData)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return defaultValue as T
      }
    }
    return defaultValue as T
  })

  // Sincronizar estado com sessionStorage quando mudar
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    sessionStorage.setItem(storageKeyOpen, String(isOpen))
  }, [isOpen, storageKeyOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (data !== undefined) {
      sessionStorage.setItem(storageKeyData, JSON.stringify(data))
    }
  }, [data, storageKeyData])

  // Função para abrir modal
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Função para fechar modal
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Função para limpar dados e fechar modal
  const clear = useCallback(() => {
    setIsOpen(false)
    setDataInternal(defaultValue as T)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKeyOpen)
      sessionStorage.removeItem(storageKeyData)
    }
  }, [defaultValue, storageKeyOpen, storageKeyData])

  // Função para atualizar dados do formulário
  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataInternal(newData)
  }, [])

  // Limpar ao desmontar componente (opcional)
  useEffect(() => {
    return () => {
      // Mantém os dados mesmo ao desmontar
      // Se quiser limpar ao desmontar, descomente:
      // if (typeof window !== 'undefined') {
      //   sessionStorage.removeItem(storageKeyOpen)
      //   sessionStorage.removeItem(storageKeyData)
      // }
    }
  }, [])

  return {
    isOpen,
    open,
    close,
    data,
    setData,
    clear // Usar após salvar com sucesso
  }
}

/**
 * Hook simplificado apenas para persistir estado aberto/fechado
 */
export function usePersistedModalState(key: string) {
  const storageKey = `modal_${key}_open`

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = sessionStorage.getItem(storageKey)
    return stored === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(storageKey, String(isOpen))
  }, [isOpen, storageKey])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return { isOpen, open, close }
}
