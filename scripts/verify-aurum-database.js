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
  console.log('🔍 Verificando estrutura AURUM no banco de dados...\n')
  console.log('🌐 URL:', supabaseUrl)
  console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...\n')
  
  // Tabelas esperadas conforme o database-final-safe.sql
  const expectedTables = [
    'bank_accounts',    // Nova estrutura  
    'categories', 
    'card_providers',   // Nova estrutura
    'cards', 
    'payment_methods',  // Nova estrutura
    'transactions'      // Transações unificadas
  ]
  
  console.log('📋 Verificando tabelas do sistema AURUM:')
  
  let foundTables = 0
  let workingTables = 0
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`❌ Tabela '${tableName}' NÃO ENCONTRADA`)
        } else if (error.code === 'PGRST301') {
          console.log(`🔒 Tabela '${tableName}' EXISTE mas está protegida por RLS`)
          foundTables++
          workingTables++
        } else {
          console.log(`⚠️  Tabela '${tableName}': ${error.code} - ${error.message}`)
          foundTables++
        }
      } else {
        console.log(`✅ Tabela '${tableName}' EXISTE e ACESSÍVEL`)
        if (data.length > 0) {
          console.log(`   📊 Registros: ${data.length}, Colunas: ${Object.keys(data[0]).join(', ')}`)
        } else {
          console.log(`   📊 Tabela vazia mas funcional`)
        }
        foundTables++
        workingTables++
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar '${tableName}': ${err.message}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Verificar se tabelas antigas ainda existem
  console.log('\n🔍 Verificando tabelas antigas (que deveriam ter sido removidas):')
  const oldTables = ['accounts', 'goals', 'budgets']
  
  for (const tableName of oldTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
        console.log(`✅ Tabela antiga '${tableName}' foi REMOVIDA corretamente`)
      } else {
        console.log(`⚠️  Tabela antiga '${tableName}' AINDA EXISTE (deveria ter sido removida)`)
      }
    } catch (err) {
      console.log(`✅ Tabela antiga '${tableName}' não existe`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📊 RESUMO DA VERIFICAÇÃO:')
  console.log(`   Tabelas encontradas: ${foundTables}/${expectedTables.length}`)
  console.log(`   Tabelas funcionais: ${workingTables}/${expectedTables.length}`)
  
  if (foundTables === expectedTables.length && workingTables === expectedTables.length) {
    console.log('\n🎉 PERFEITO! Todas as tabelas AURUM estão criadas e funcionais!')
    console.log('   ✅ O script database-final-safe.sql foi executado com sucesso!')
    console.log('   ✅ Sua aplicação deve estar funcionando perfeitamente!')
    console.log('\n🚀 Próximos passos:')
    console.log('   1. Acesse: https://aurum-ookcgg0lp-jbpaizs-projects.vercel.app')
    console.log('   2. Faça login/cadastro')
    console.log('   3. Execute no SQL Editor: SELECT create_demo_data_for_user(auth.uid());')
  } else if (foundTables < expectedTables.length) {
    console.log('\n⚠️  INCOMPLETO: Nem todas as tabelas foram criadas!')
    console.log('   📋 Action required: Execute o script database-final-safe.sql no Supabase SQL Editor')
  } else {
    console.log('\n✅ BOAS NOTÍCIAS: Todas as tabelas existem!')
    console.log('   🔐 Algumas podem estar protegidas por RLS (isso é normal)')
  }
}

verifyDatabaseStructure().then(() => {
  console.log('\n🔍 Verificação AURUM concluída!')
}).catch(error => {
  console.error('❌ Erro fatal:', error.message)
})
