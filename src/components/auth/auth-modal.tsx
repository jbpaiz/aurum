'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Chrome,
  DollarSign,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react'

interface AuthModalProps {
  onClose?: () => void
  showCloseButton?: boolean
}

export function AuthModal({ onClose, showCloseButton = true }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetStatus, setResetStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [resendTimer, setResendTimer] = useState(0)

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const { toast } = useToast()

  const triggerPasswordReset = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Informe seu email',
        description: 'Precisamos do email cadastrado para enviar o link.'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setResetStatus('error')
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar email',
          description: error.message
        })
      } else {
        setResetStatus('sent')
        setResendTimer(60)
        toast({
          variant: 'success',
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada e spam. Você pode reenviar em instantes.'
        })
      }
    } catch (error) {
      setResetStatus('error')
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'forgot') {
      await triggerPasswordReset()
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao fazer login",
            description: error.message === 'Invalid login credentials' 
              ? 'Email ou senha incorretos'
              : error.message
          })
        } else {
          toast({
            variant: "success",
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao Aurum"
          })
          onClose?.()
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast({
            variant: "destructive",
            title: "Erro na confirmação",
            description: "As senhas não coincidem"
          })
          return
        }
        
        const { error } = await signUp(email, password, {
          full_name: fullName,
        })
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: error.message
          })
        } else {
          toast({
            variant: "success",
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta"
          })
          setMode('signin')
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login com Google",
          description: error.message
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setShowPassword(false)
    setResetStatus('idle')
    setResendTimer(0)
  }

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode)
    resetForm()
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (mode === 'forgot' && resetStatus !== 'idle') {
      setResetStatus('idle')
      setResendTimer(0)
    }
  }

  useEffect(() => {
    if (!resendTimer) return
    const timer = setInterval(() => {
      setResendTimer((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendTimer])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="space-y-6 p-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Aurum</h2>
            <p className="text-sm text-gray-500">
              {mode === 'signin' && 'Entre para acessar sua conta'}
              {mode === 'signup' && 'Crie sua conta e organize suas finanças'}
              {mode === 'forgot' && 'Recupere o acesso à sua conta'}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-1">
            {(
              [
                { id: 'signin', label: 'Entrar' },
                { id: 'signup', label: 'Criar conta' },
                { id: 'forgot', label: 'Recuperar' }
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={`flex-1 rounded-lg text-sm transition-all ${
                  mode === item.id 
                    ? 'bg-white text-gray-900 shadow-sm font-medium' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => switchMode(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {mode !== 'forgot' && (
            <>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleGoogleSignIn} 
                disabled={loading} 
                className="w-full h-12 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium text-base"
              >
                <Chrome className="mr-2 h-5 w-5" /> 
                Continuar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Ou use email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 pl-10 border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="h-11 pl-10 border-gray-200 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 border-gray-200 focus:border-blue-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pl-10 border-gray-200 focus:border-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'signin' && 'Entrar'}
                {mode === 'signup' && 'Criar conta'}
                {mode === 'forgot' && 'Enviar link'}
              </Button>
          </form>

          {mode === 'forgot' && resetStatus === 'sent' && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-gray-600">
              <p className="text-xs">
                Link enviado para {email}. Verifique sua caixa de entrada.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerPasswordReset}
                disabled={loading || !email || resendTimer > 0}
                className="w-full"
              >
                {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar'}
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
              {mode === 'signin' && (
                <div className="flex flex-col gap-2">
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => switchMode('forgot')}>
                    Esqueceu a senha?
                  </button>
                  <div>
                    Não tem conta?{' '}
                    <button type="button" className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => switchMode('signup')}>
                      Criar conta
                    </button>
                  </div>
                </div>
              )}
              {mode === 'signup' && (
                <div>
                  Já tem uma conta?{' '}
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => switchMode('signin')}>
                    Entrar
                  </button>
                </div>
              )}
              {mode === 'forgot' && (
                <div>
                  Lembrou a senha?{' '}
                  <button type="button" className="text-blue-600 hover:text-blue-700 font-medium" onClick={() => switchMode('signin')}>
                    Voltar
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
