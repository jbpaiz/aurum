'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

interface SupabaseConfigProps {
  isConfigured: boolean
}

export function SupabaseConfig({ isConfigured }: SupabaseConfigProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  if (isConfigured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Supabase Conectado</p>
            <p className="text-sm text-green-700">Banco de dados online funcionando perfeitamente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">Configuração do Supabase</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Configure sua base de dados para salvar transações reais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Atualmente em <strong>modo demonstração</strong>. Os dados não são persistidos.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowInstructions(!showInstructions)}
            variant="outline"
            size="sm"
          >
            {showInstructions ? 'Ocultar' : 'Ver'} Instruções
          </Button>
          <Button 
            onClick={() => window.open('https://supabase.com', '_blank')}
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Supabase
          </Button>
        </div>

        {showInstructions && (
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h4 className="font-semibold text-gray-900">📋 Passos Rápidos:</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                <div>
                  <p className="font-medium">Crie uma conta gratuita no Supabase</p>
                  <p className="text-gray-600">Acesse supabase.com e crie um novo projeto</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                <div>
                  <p className="font-medium">Configure as credenciais</p>
                  <p className="text-gray-600">Edite o arquivo .env.local com suas chaves API</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                <div>
                  <p className="font-medium">Execute a configuração</p>
                  <p className="text-gray-600">
                    Execute: <code className="bg-gray-100 px-1 rounded">npm run supabase:setup</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">
                <strong>💡 Dica:</strong> Consulte o arquivo{' '}
                <code className="bg-white px-1 rounded">SUPABASE_SETUP.md</code>{' '}
                para instruções detalhadas passo a passo.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
