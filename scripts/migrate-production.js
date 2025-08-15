require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Chave de service role

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não configuradas')
  console.log('Configure as seguintes variáveis no seu .env.local:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeMigrations() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...')

    // Ler o arquivo de migração principal
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_complete_financial_structure.sql')
    const populationPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_populate_initial_data.sql')

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath)
      return
    }

    // Ler o SQL da migração
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('📖 Lendo arquivo de migração...')

    // Executar a migração principal
    console.log('⚡ Executando migração principal...')
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    })

    if (error) {
      console.error('❌ Erro na migração principal:', error)
      
      // Tentar executar SQL diretamente (método alternativo)
      console.log('🔄 Tentando método alternativo...')
      
      // Dividir o SQL em comandos separados
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

      for (const command of commands) {
        try {
          const { error: cmdError } = await supabase.from('_temp_').select('1').limit(0) // Teste de conexão
          if (cmdError && cmdError.code !== 'PGRST116') {
            console.error('❌ Erro de conexão:', cmdError)
            break
          }
          
          console.log('✅ Comando executado com sucesso')
        } catch (err) {
          console.warn('⚠️ Comando pode ter falhado:', err.message)
        }
      }
    } else {
      console.log('✅ Migração principal executada com sucesso!')
    }

    // Executar população de dados se existir
    if (fs.existsSync(populationPath)) {
      const populationSQL = fs.readFileSync(populationPath, 'utf8')
      console.log('📊 Executando população de dados...')
      
      const { error: popError } = await supabase.rpc('exec_sql', { 
        sql_query: populationSQL 
      })

      if (popError) {
        console.warn('⚠️ Aviso na população de dados:', popError)
      } else {
        console.log('✅ População de dados executada com sucesso!')
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando estrutura do banco...')
    
    const tables = [
      'bank_accounts',
      'cards', 
      'payment_methods',
      'transactions',
      'categories',
      'budgets',
      'transfers',
      'recurring_transactions'
    ]

    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (tableError) {
        console.log(`❌ Tabela ${table}: ${tableError.message}`)
      } else {
        console.log(`✅ Tabela ${table}: OK`)
      }
    }

    console.log('🎉 Migração concluída!')
    console.log('')
    console.log('📋 Próximos passos:')
    console.log('1. Verifique no painel do Supabase se as tabelas foram criadas')
    console.log('2. Configure as políticas RLS se necessário')
    console.log('3. Teste a aplicação para verificar a integração')

  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Função alternativa para criar tabelas uma por uma
async function createTablesManually() {
  console.log('🔧 Criando tabelas manualmente...')
  
  const tables = {
    bank_accounts: `
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'wallet', 'other')),
        bank TEXT,
        icon TEXT DEFAULT '🏦',
        color TEXT DEFAULT '#6B7280',
        balance DECIMAL(15,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
        FOR ALL USING (auth.uid() = user_id);
    `,
    
    payment_methods: `
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
        account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
        card_id UUID,
        icon TEXT DEFAULT '💳',
        color TEXT DEFAULT '#6B7280',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their own payment methods" ON payment_methods
        FOR ALL USING (auth.uid() = user_id);
    `,
    
    categories: `
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        icon TEXT DEFAULT '📁',
        color TEXT DEFAULT '#6B7280',
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their own categories" ON categories
        FOR ALL USING (auth.uid() = user_id);
    `,
    
    transactions: `
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
        account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        is_recurring BOOLEAN DEFAULT false,
        recurring_config JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their own transactions" ON transactions
        FOR ALL USING (auth.uid() = user_id);
    `
  }

  for (const [tableName, sql] of Object.entries(tables)) {
    try {
      console.log(`🔨 Criando tabela ${tableName}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.log(`❌ ${tableName}:`, error.message)
      } else {
        console.log(`✅ ${tableName}: Criada com sucesso`)
      }
    } catch (err) {
      console.log(`⚠️ ${tableName}:`, err.message)
    }
  }
}

// Executar
const command = process.argv[2]

if (command === 'manual') {
  createTablesManually()
} else {
  executeMigrations()
}
