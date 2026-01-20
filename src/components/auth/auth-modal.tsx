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
  CheckCircle2,
  TrendingUp
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
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-white">
      {/* Close Button */}
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-100 dark:hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-50 dark:via-indigo-50 dark:to-purple-50 items-center justify-center p-12">
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-900">Aurum</h1>
            <p className="text-xl text-gray-600 dark:text-gray-600">
              Controle financeiro inteligente e produtividade em um só lugar
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              { icon: <TrendingUp className="h-5 w-5" />, title: 'Gestão Financeira', desc: 'Controle total de receitas e despesas' },
              { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Metas e Tarefas', desc: 'Organize sua vida com kanban integrado' },
              { icon: <DollarSign className="h-5 w-5" />, title: 'Relatórios', desc: 'Visualize seu progresso em tempo real' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 text-blue-600 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Aurum</h2>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-900">
              {mode === 'signin' && 'Bem-vindo de volta'}
              {mode === 'signup' && 'Criar sua conta'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-600">
              {mode === 'signin' && 'Entre para continuar no Aurum'}
              {mode === 'signup' && 'Comece a organizar suas finanças hoje'}
              {mode === 'forgot' && 'Vamos ajudar você a recuperar o acesso'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleGoogleSignIn} 
                disabled={loading} 
                className="w-full h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-base bg-white dark:bg-white dark:text-blue-600 dark:border-blue-600 dark:hover:bg-blue-50"
              >
                <Chrome className="mr-2 h-5 w-5" /> 
                Entrar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">ou</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 pl-11 text-base border-gray-300 bg-white dark:bg-white dark:text-gray-900 dark:border-gray-300"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="h-12 pl-11 text-base border-gray-300 bg-white dark:bg-white dark:text-gray-900 dark:border-gray-300"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 text-base border-gray-300 bg-white dark:bg-white dark:text-gray-900 dark:border-gray-300"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-11 text-base border-gray-300 bg-white dark:bg-white dark:text-gray-900 dark:border-gray-300"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {mode === 'signin' && 'Entrar'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot' && 'Enviar link'}
            </Button>
          </form>

          {mode === 'forgot' && resetStatus === 'sent' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-50 dark:border-blue-200 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-700">
                Link enviado para <strong>{email}</strong>. Verifique sua caixa de entrada.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerPasswordReset}
                disabled={loading || !email || resendTimer > 0}
                className="mt-3 w-full bg-white dark:bg-white dark:text-gray-900 dark:border-gray-300"
              >
                {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar link'}
              </Button>
            </div>
          )}

          <div className="text-center text-sm">
            {mode === 'signin' && (
              <div className="space-y-3">
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-600 dark:hover:text-blue-700 font-medium hover:underline" 
                  onClick={() => switchMode('forgot')}
                >
                  Esqueceu a senha?
                </button>
                <div className="text-gray-600 dark:text-gray-600">
                  Não tem conta?{' '}
                  <button 
                    type="button" 
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-600 dark:hover:text-blue-700 font-medium hover:underline" 
                    onClick={() => switchMode('signup')}
                  >
                    Criar conta gratuita
                  </button>
                </div>
              </div>
            )}
            {mode === 'signup' && (
              <div className="text-gray-600 dark:text-gray-600">
                Já tem uma conta?{' '}
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-600 dark:hover:text-blue-700 font-medium hover:underline" 
                  onClick={() => switchMode('signin')}
                >
                  Entrar
                </button>
              </div>
            )}
            {mode === 'forgot' && (
              <div className="text-gray-600 dark:text-gray-600">
                Lembrou a senha?{' '}
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-600 dark:hover:text-blue-700 font-medium hover:underline" 
                  onClick={() => switchMode('signin')}
                >
                  Voltar ao login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
