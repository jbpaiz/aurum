'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowLeft,
  DollarSign,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Aurum</h1>
          </div>
          
          <CardTitle className="text-2xl">
            {mode === 'signin' && 'Entrar na sua conta'}
            {mode === 'signup' && 'Criar conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </CardTitle>
          
          <CardDescription>
            {mode === 'signin' && 'Digite suas credenciais para acessar'}
            {mode === 'signup' && 'Crie sua conta para começar'}
            {mode === 'forgot' && 'Digite seu email para recuperar a senha'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome completo - apenas no signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Senha - não mostrar no forgot */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmar senha - apenas no signup */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Botão principal */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signin' && 'Entrar'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot' && 'Enviar email'}
            </Button>
          </form>

          {/* OAuth - apenas em signin e signup */}
          {mode !== 'forgot' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="w-full"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={loading}
                  className="w-full"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </>
          )}

          {/* Links de navegação */}
          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
                <div className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Criar conta
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-primary hover:underline"
                >
                  Fazer login
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao login
              </button>
            )}
          </div>

          {/* Botão fechar */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full mt-4"
          >
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
