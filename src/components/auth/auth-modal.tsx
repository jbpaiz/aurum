'use client'

import { useState } from 'react'
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
  Github,
  Chrome,
  DollarSign,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          onClose()
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
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao enviar email",
            description: error.message
          })
        } else {
          toast({
            variant: "success",
            title: "Email enviado!",
            description: "Verifique sua caixa de entrada"
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

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)
    try {
      const { error } = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithGitHub()
      
      if (error) {
        toast({
          variant: "destructive",
          title: `Erro ao fazer login com ${provider === 'google' ? 'Google' : 'GitHub'}`,
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
  }

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/5 p-2 text-gray-500 transition hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white md:flex">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/90">
                <DollarSign className="h-4 w-4" /> Plataforma Aurum
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Controle inteligente</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight">
                  Toda sua vida financeira<br /> e produtiva num só hub.
                </h2>
              </div>
              <ul className="space-y-4 text-sm text-white/90">
                {["Painéis financeiros em tempo real", "Kanban integrado às metas", "Exportação segura e auditável"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute inset-x-10 bottom-10 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/60">Status atual</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold">+32%</p>
                  <p className="text-xs text-white/70">metas concluídas</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">R$ 58k</p>
                  <p className="text-xs text-white/70">saldo consolidado</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-8 md:p-10">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Bem-vindo ao Aurum</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {mode === 'signin' && 'Entre para continuar'}
                {mode === 'signup' && 'Crie sua conta em segundos'}
                {mode === 'forgot' && 'Recupere o acesso rapidamente'}
              </h3>
              <p className="text-sm text-gray-500">
                {mode === 'signin' && 'Use suas credenciais para acessar o hub financeiro + tarefas.'}
                {mode === 'signup' && 'Basta informar email e senha para começar sua jornada.'}
                {mode === 'forgot' && 'Enviaremos um link seguro para redefinir sua senha.'}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
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
                  variant={mode === item.id ? 'default' : 'ghost'}
                  className={`flex-1 rounded-full text-sm ${mode === item.id ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
                  onClick={() => switchMode(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'signin' && 'Entrar agora'}
                {mode === 'signup' && 'Criar conta gratuita'}
                {mode === 'forgot' && 'Enviar link de recuperação'}
              </Button>
            </form>

            {mode !== 'forgot' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex-1 border-t" />
                  Ou continue com
                  <span className="flex-1 border-t" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={loading}>
                    <Chrome className="mr-2 h-4 w-4 text-red-500" /> Google
                  </Button>
                  <Button variant="outline" onClick={() => handleOAuthSignIn('github')} disabled={loading}>
                    <Github className="mr-2 h-4 w-4" /> GitHub
                  </Button>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              {mode === 'signin' && (
                <div className="flex flex-col gap-1 text-center">
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => switchMode('forgot')}>
                    Esqueci minha senha
                  </button>
                  <span>
                    Novo por aqui?{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={() => switchMode('signup')}>
                      Criar conta
                    </button>
                  </span>
                </div>
              )}
              {mode === 'signup' && (
                <p className="text-center">
                  Já possui acesso?{' '}
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => switchMode('signin')}>
                    Entrar
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p className="text-center">
                  Lembrou a senha?{' '}
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => switchMode('signin')}>
                    Voltar ao login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
