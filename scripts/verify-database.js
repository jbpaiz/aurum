const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.log('Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...\n')
  
  try {
    // Verificar conexão
    console.log('1. Testando conexão com Supabase...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message)
      return
    }
    console.log('✅ Conexão estabelecida com sucesso!\n')

    // Verificar tabelas existentes
    console.log('2. Verificando tabelas existentes...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_user_tables')
      .select()
    
    if (tablesError) {
      console.log('⚠️  Função get_user_tables não encontrada. Usando método alternativo...')
      
      // Método alternativo - verificar tabelas específicas
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
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`❌ Tabela '${tableName}' não encontrada`)
          } else {
            console.log(`⚠️  Tabela '${tableName}': ${error.message}`)
          }
        } else {
          console.log(`✅ Tabela '${tableName}' existe`)
        }
      }
    } else {
      console.log('📋 Tabelas encontradas:')
      tables.forEach(table => console.log(`✅ ${table.table_name}`))
    }

    console.log('\n3. Verificando estrutura da tabela accounts...')
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1)
    
    if (accountsError) {
      console.log(`❌ Erro ao acessar tabela accounts: ${accountsError.message}`)
    } else {
      console.log('✅ Tabela accounts acessível')
      if (accountsData.length > 0) {
        console.log('📊 Estrutura detectada:', Object.keys(accountsData[0]))
      } else {
        console.log('📊 Tabela accounts existe mas está vazia')
      }
    }

    console.log('\n4. Verificando estrutura da tabela transactions...')
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1)
    
    if (transactionsError) {
      console.log(`❌ Erro ao acessar tabela transactions: ${transactionsError.message}`)
    } else {
      console.log('✅ Tabela transactions acessível')
      if (transactionsData.length > 0) {
        console.log('📊 Estrutura detectada:', Object.keys(transactionsData[0]))
      } else {
        console.log('📊 Tabela transactions existe mas está vazia')
      }
    }

    console.log('\n5. Verificando RLS (Row Level Security)...')
    const { data: rlsData, error: rlsError } = await supabase
      .from('accounts')
      .select('id, name')
      .limit(5)
    
    if (rlsError) {
      if (rlsError.code === 'PGRST301') {
        console.log('⚠️  RLS ativo - usuário não autenticado não pode acessar dados')
      } else {
        console.log(`❌ Erro RLS: ${rlsError.message}`)
      }
    } else {
      console.log('✅ RLS configurado corretamente ou dados públicos acessíveis')
      console.log(`📊 ${rlsData.length} registros encontrados em accounts`)
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

// Executar verificação
verifyDatabaseStructure().then(() => {
  console.log('\n🔍 Verificação concluída!')
}).catch(error => {
  console.error('❌ Erro fatal:', error.message)
})
