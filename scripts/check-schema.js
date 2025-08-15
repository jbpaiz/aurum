require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableSchema() {
  console.log('🔍 Verificando esquema das tabelas...')
  
  // Verificar estrutura da tabela bank_accounts
  const { data: bankAccountsSchema, error } = await supabase
    .rpc('get_table_columns', { table_name: 'bank_accounts' })
    .select('*')

  if (error) {
    console.log('ℹ️  Usando método alternativo para verificar colunas...')
    
    // Método alternativo: fazer uma query simples e ver o que retorna
    const { data: sampleData, error: sampleError } = await supabase
      .from('bank_accounts')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.log('❌ Erro ao verificar banco de dados:', sampleError.message)
    } else {
      console.log('✅ Estrutura acessível. Verificando pelo exemplo:')
      console.log('💾 Dados de exemplo (vazio é normal):', sampleData)
    }
  } else {
    console.log('📋 Colunas da tabela bank_accounts:', bankAccountsSchema)
  }

  // Verificar se temos usuários de teste
  console.log('\n👥 Verificando usuários existentes...')
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.log('❌ Erro ao listar usuários:', usersError.message)
  } else {
    console.log(`📊 Total de usuários: ${users.users.length}`)
    if (users.users.length > 0) {
      console.log('🔑 Primeiro usuário ID:', users.users[0].id)
    } else {
      console.log('⚠️  Nenhum usuário encontrado - precisamos criar um usuário de teste')
    }
  }
}

checkTableSchema()
