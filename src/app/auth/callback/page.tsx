"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error">("loading")
  const [message, setMessage] = useState("Conectando sua conta do Google...")

  useEffect(() => {
    const code = searchParams.get("code")
    const errorDescription = searchParams.get("error_description")

    const exchangeCode = async () => {
      if (errorDescription) {
        setMessage(decodeURIComponent(errorDescription))
        setStatus("error")
        return
      }

      if (!code) {
        setMessage("Código de autorização não encontrado.")
        setStatus("error")
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        setMessage(error.message)
        setStatus("error")
        return
      }

      router.replace("/")
    }

    exchangeCode()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-white/10 p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <div>
            <p className="text-lg font-medium">Autenticando...</p>
            <p className="text-sm text-white/70">
              {message || "Estamos finalizando seu login com segurança."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-red-500/10 p-4 text-red-300">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold">Não foi possível finalizar o login</p>
            <p className="text-sm text-white/70">{message}</p>
          </div>
          <Button onClick={() => router.replace("/")} size="sm" variant="outline" className="text-slate-900">
            Voltar para o início
          </Button>
        </div>
      )}
    </div>
  )
}
