require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Verificar se as variáveis estão configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuração do Supabase...')
console.log('')

if (!supabaseUrl || supabaseUrl === 'sua_url_do_projeto_aqui') {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL não configurada')
  console.log('📝 Configure no arquivo .env.local')
  console.log('')
  process.exit(1)
}

if (!supabaseAnonKey || supabaseAnonKey === 'sua_chave_publica_aqui') {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada') 
  console.log('📝 Configure no arquivo .env.local')
  console.log('')
  process.exit(1)
}

console.log('✅ URL configurada:', supabaseUrl)
console.log('✅ Chave pública configurada: ****' + supabaseAnonKey.slice(-10))
console.log('')

// Testar conexão
async function testConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Teste básico de conexão
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message !== 'Auth session missing!') {
      throw error
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    console.log('')
    
    // Verificar se as tabelas existem
    console.log('🔍 Verificando estrutura do banco...')
    
    const tables = ['bank_accounts', 'payment_methods', 'categories', 'transactions']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Tabela '${table}': ${error.message}`)
        } else {
          console.log(`✅ Tabela '${table}': OK`)
        }
      } catch (err) {
        console.log(`⚠️ Tabela '${table}': ${err.message}`)
      }
    }
    
    console.log('')
    console.log('🎯 Próximos passos:')
    console.log('1. Se todas as tabelas estão OK, o projeto está pronto!')
    console.log('2. Se alguma tabela está faltando, execute: node scripts/migrate-production.js')
    console.log('3. Inicie o projeto: npm run dev')
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
    console.log('')
    console.log('🔧 Verifique:')
    console.log('1. Se as credenciais no .env.local estão corretas')
    console.log('2. Se o projeto Supabase está ativo')
    console.log('3. Se as chaves não expiraram')
  }
}

testConnection()
