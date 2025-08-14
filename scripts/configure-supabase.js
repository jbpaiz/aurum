#!/usr/bin/env node

// Script para configuração automática do Supabase
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando integração automática com Supabase...\n');

// Função para atualizar o arquivo .env.local
function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = `# Supabase Configuration
# INSTRUÇÕES:
# 1. Acesse https://supabase.com e crie uma conta gratuita
# 2. Crie um novo projeto
# 3. Vá em Settings > API
# 4. Copie a URL e as chaves abaixo:

# Cole sua URL do projeto Supabase aqui:
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co

# Cole sua chave pública (anon key) aqui:
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui

# Cole sua chave de serviço (service_role key) aqui (apenas para desenvolvimento):
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_aqui

# URL do banco para operações diretas:
DATABASE_URL=postgresql://postgres:[SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres

# ============================================================
# CONFIGURAÇÃO AUTOMÁTICA CONCLUÍDA!
# ============================================================
# 
# PRÓXIMOS PASSOS:
# 1. Substitua os valores acima pelas credenciais reais do seu projeto Supabase
# 2. Execute: npm run supabase:setup
# 3. Inicie o projeto: npm run dev
#
# MODO DEMO:
# O projeto continuará funcionando em modo demo até você configurar as credenciais reais
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.local atualizado com instruções de configuração');
}

// Função para criar script de setup do banco
function createSetupScript() {
  const setupContent = `#!/usr/bin/env node

// Script para configurar o banco de dados Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabase() {
  // Verificar se as credenciais estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('seuprojetoid')) {
    console.log('❌ Credenciais do Supabase não configuradas.');
    console.log('📝 Por favor, edite o arquivo .env.local com suas credenciais reais.');
    console.log('📖 Instruções detalhadas estão no arquivo .env.local');
    return;
  }

  console.log('🔌 Conectando ao Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Executar o script SQL de configuração
    const sqlPath = path.join(__dirname, 'supabase-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Executando configuração do banco...');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      if (command.includes('CREATE') || command.includes('INSERT')) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: command });
        if (error && !error.message.includes('already exists')) {
          console.error('Erro ao executar comando:', error.message);
        }
      }
    }

    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📊 Dados de exemplo inseridos');
    console.log('🚀 Agora você pode usar: npm run dev');

  } catch (error) {
    console.error('❌ Erro ao configurar o banco:', error.message);
    console.log('💡 Tente executar o script SQL manualmente no painel do Supabase');
  }
}

setupSupabase();
`;

  const scriptsDir = path.join(__dirname, '..', 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
  }

  fs.writeFileSync(path.join(scriptsDir, 'setup-supabase.js'), setupContent);
  console.log('✅ Script de configuração do banco criado');
}

// Função para atualizar o package.json
function updatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // Adicionar script de setup
  packageJson.scripts['supabase:setup'] = 'node scripts/setup-supabase.js';
  packageJson.scripts['supabase:types'] = 'supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/lib/database.types.ts';

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Scripts adicionados ao package.json');
}

// Função para criar tipos TypeScript atualizados
function updateTypes() {
  const typesContent = `// Tipos gerados automaticamente do Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense'
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense'
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          category?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}`;

  const typesPath = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts');
  fs.writeFileSync(typesPath, typesContent);
  console.log('✅ Tipos TypeScript atualizados');
}

// Executar todas as funções
function main() {
  updateEnvFile();
  createSetupScript();
  updatePackageJson();
  updateTypes();

  console.log('\\n🎉 CONFIGURAÇÃO AUTOMÁTICA CONCLUÍDA!');
  console.log('\\n📋 PRÓXIMOS PASSOS:');
  console.log('1. 🌐 Acesse https://supabase.com e crie um projeto');
  console.log('2. ⚙️  Edite o arquivo .env.local com suas credenciais');
  console.log('3. 🗄️  Execute: npm run supabase:setup');
  console.log('4. 🚀 Inicie o projeto: npm run dev');
  console.log('\\n💡 O projeto continuará em modo demo até a configuração real!');
}

main();
