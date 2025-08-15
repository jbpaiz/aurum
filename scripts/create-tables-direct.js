require('dotenv').config({ path: '.env.local' })

async function createTablesViaAPI() {
  console.log('🔧 Tentando criar tabelas via API do Supabase...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Credenciais do Supabase não encontradas')
    return
  }
  
  console.log('📋 Infelizmente, não posso executar DDL (CREATE TABLE) via API REST do Supabase')
  console.log('🔒 Isso requer permissões de service_role ou acesso direto ao SQL Editor')
  console.log('')
  console.log('💡 SOLUÇÃO: Você precisa executar manualmente no Supabase Dashboard')
  console.log('')
  console.log('🎯 PASSOS EXATOS:')
  console.log('')
  console.log('1. 🌐 Vá para: https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql/new')
  console.log('2. 📋 Copie TUDO do arquivo: database-setup.sql')
  console.log('3. 📝 Cole no SQL Editor')
  console.log('4. ▶️ Clique em "Run"')
  console.log('5. ✅ Aguarde o sucesso')
  console.log('')
  console.log('🚀 Vou abrir o arquivo SQL para você copiar:')
  console.log('')
  
  // Ler e mostrar o conteúdo do arquivo SQL
  const fs = require('fs')
  const path = require('path')
  
  try {
    const sqlPath = path.join(__dirname, '..', 'database-setup.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 CONTEÚDO DO ARQUIVO database-setup.sql:')
    console.log('=' .repeat(60))
    console.log(sqlContent)
    console.log('=' .repeat(60))
    console.log('')
    console.log('✅ Copie TUDO acima e cole no Supabase SQL Editor!')
    
  } catch (error) {
    console.log('❌ Erro ao ler arquivo SQL:', error.message)
  }
}

// Função alternativa usando curl (se disponível)
async function tryWithCurl() {
  console.log('')
  console.log('🔄 Tentativa alternativa com curl...')
  
  const { exec } = require('child_process')
  
  exec('curl --version', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ curl não disponível')
      return
    }
    
    console.log('✅ curl disponível, mas ainda assim precisamos de service_role key')
    console.log('🔑 Para usar curl, você precisaria de SUPABASE_SERVICE_ROLE_KEY')
  })
}

createTablesViaAPI()
tryWithCurl()
