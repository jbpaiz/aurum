const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...\n')
  console.log('🌐 URL:', supabaseUrl)
  console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...\n')
  
  const expectedTables = [
    'accounts', 
    'categories', 
    'cards', 
    'transactions', 
    'goals', 
    'budgets'
  ]
  
  console.log('📋 Verificando tabelas esperadas:')
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`❌ Tabela '${tableName}' não encontrada`)
        } else if (error.code === 'PGRST301') {
          console.log(`🔒 Tabela '${tableName}' existe mas RLS bloqueia acesso (normal para usuário não autenticado)`)
        } else {
          console.log(`⚠️  Tabela '${tableName}': ${error.code} - ${error.message}`)
        }
      } else {
        console.log(`✅ Tabela '${tableName}' existe e acessível`)
        if (data.length > 0) {
          console.log(`   📊 Colunas: ${Object.keys(data[0]).join(', ')}`)
        } else {
          console.log(`   📊 Tabela vazia`)
        }
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar '${tableName}': ${err.message}`)
    }
    
    // Pequena pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Teste de autenticação
  console.log('\n🔐 Testando autenticação...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.log('⚠️  Usuário não autenticado (esperado para este teste)')
    } else if (user) {
      console.log(`✅ Usuário autenticado: ${user.email}`)
    }
  } catch (err) {
    console.log(`⚠️  Erro de autenticação: ${err.message}`)
  }
}

// Executar verificação
verifyDatabaseStructure().then(() => {
  console.log('\n🔍 Verificação concluída!')
}).catch(error => {
  console.error('❌ Erro fatal:', error.message)
})
