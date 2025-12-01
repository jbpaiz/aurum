'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('Conectando sua conta do Google...')

  useEffect(() => {
    const errorDescription = searchParams.get('error_description')

    const handleCallback = async () => {
      if (errorDescription) {
        setMessage(decodeURIComponent(errorDescription))
        setStatus('error')
        return
      }

      // O Supabase automaticamente processa o callback OAuth e troca o code por session
      // Não precisamos fazer nada manualmente aqui
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setMessage(error.message)
        setStatus('error')
        return
      }

      if (data.session) {
        router.replace('/')
      } else {
        setMessage('Não foi possível estabelecer a sessão.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-white/10 p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <div>
            <p className="text-lg font-medium">Autenticando...</p>
            <p className="text-sm text-white/70">
              {message || 'Estamos finalizando seu login com segurança.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-red-500/10 p-4 text-red-300">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div>
          <p className="text-lg font-semibold">Não foi possível finalizar o login</p>
          <p className="text-sm text-white/70">{message}</p>
        </div>
        <Button onClick={() => router.replace('/')} size="sm" variant="outline" className="text-slate-900">
          Voltar para o início
        </Button>
      </div>
    </div>
  )
}
