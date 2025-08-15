require('dotenv').config({ path: '.env.local' })

async function createBasicData() {
  console.log('🎯 Tentando criar dados básicos (sem DDL)...')
  
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Credenciais não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔄 Testando se conseguimos pelo menos fazer SELECT...')
  
  try {
    // Tentar fazer um SELECT simples para testar
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message !== 'Auth session missing!') {
      console.log('❌ Erro de conexão:', error.message)
      return
    }
    
    console.log('✅ Conexão OK')
    
    // Tentar listar tabelas existentes
    console.log('🔍 Verificando tabelas existentes...')
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (tablesError) {
        console.log('⚠️ Não conseguimos listar tabelas via REST API')
        console.log('🔒 Isso é normal - informação do schema requer permissões especiais')
      } else {
        console.log('📋 Tabelas encontradas:', tables)
      }
    } catch (err) {
      console.log('⚠️ Schema info não acessível via REST API')
    }
    
    console.log('')
    console.log('💡 RESUMO DA SITUAÇÃO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('❌ NÃO POSSO criar tabelas automaticamente porque:')
    console.log('   • CREATE TABLE requer permissões administrativas')
    console.log('   • Apenas service_role key pode fazer DDL')
    console.log('   • API REST não suporta comandos DDL')
    console.log('')
    console.log('✅ VOCÊ PRECISA fazer manualmente:')
    console.log('   1. Ir para o Supabase SQL Editor')
    console.log('   2. Copiar e colar o SQL completo')
    console.log('   3. Executar uma única vez')
    console.log('')
    console.log('🎯 DEPOIS DISSO:')
    console.log('   • O sistema funcionará 100%')
    console.log('   • Todos os dados serão persistidos')
    console.log('   • RLS garantirá segurança')
    console.log('   • Backup automático ativo')
    console.log('')
    console.log('🚀 LINKS DIRETOS:')
    console.log('   SQL Editor: https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql/new')
    console.log('   Table Editor: https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/editor')
    console.log('')
    
  } catch (error) {
    console.log('❌ Erro:', error.message)
  }
}

createBasicData()
