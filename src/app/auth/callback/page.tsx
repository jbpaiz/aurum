import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

import { AuthCallbackHandler } from '@/components/auth/auth-callback-handler'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackHandler />
    </Suspense>
  )
}

function AuthCallbackFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-white/10 p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div>
          <p className="text-lg font-medium">Autenticando...</p>
          <p className="text-sm text-white/70">Preparando ambiente seguro...</p>
        </div>
      </div>
    </div>
  )
}
