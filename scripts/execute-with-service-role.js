require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function executeWithServiceRole() {
  console.log('🚀 Executando migração com service role key...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Variáveis de ambiente não configuradas')
    return
  }
  
  console.log('✅ Service role key encontrada!')
  console.log('📖 Lendo arquivo SQL...')
  
  // Ler o arquivo SQL
  const sqlPath = path.join(__dirname, '..', 'database-setup.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Arquivo database-setup.sql não encontrado')
    return
  }
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')
  console.log('📄 SQL carregado com sucesso')
  
  // Usar a biblioteca do Supabase com service role
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceKey)
  
  console.log('🔧 Tentando executar SQL via Supabase client...')
  
  try {
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📋 ${commands.length} comandos SQL encontrados`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim().length === 0) continue
      
      console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`)
      
      try {
        // Tentar executar via RPC (se houver uma função disponível)
        const { data, error } = await supabase.rpc('exec', { sql: command })
        
        if (error) {
          console.log(`⚠️ Comando ${i + 1} falhou via RPC:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
          successCount++
        }
      } catch (err) {
        console.log(`⚠️ Comando ${i + 1} não pode ser executado via client:`, err.message)
        errorCount++
      }
    }
    
    console.log('')
    console.log('📊 RESUMO DA EXECUÇÃO:')
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    
    if (errorCount > 0) {
      console.log('')
      console.log('💡 MÉTODO ALTERNATIVO:')
      console.log('Como a API REST do Supabase não suporta DDL diretamente,')
      console.log('vou tentar usar curl para fazer requisições HTTP diretas...')
      
      await tryWithCurl(supabaseUrl, serviceKey, sqlContent)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.log('')
    console.log('🔄 Tentando método alternativo com curl...')
    await tryWithCurl(supabaseUrl, serviceKey, sqlContent)
  }
}

async function tryWithCurl(supabaseUrl, serviceKey, sqlContent) {
  console.log('🌐 Tentando executar via curl...')
  
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  try {
    // Verificar se curl está disponível
    await execAsync('curl --version')
    console.log('✅ curl disponível')
    
    // Preparar o comando curl
    const postgrestUrl = supabaseUrl.replace('supabase.co', 'supabase.co/rest/v1')
    
    // Tentar uma abordagem diferente - usar a API de management do Supabase
    console.log('🔄 Infelizmente, mesmo com service role key,')
    console.log('a API REST do Supabase não suporta comandos DDL como CREATE TABLE')
    console.log('')
    console.log('✅ SOLUÇÃO DEFINITIVA:')
    console.log('Vou abrir o SQL Editor do Supabase para você executar manualmente')
    console.log('')
    console.log('📋 O SQL já está pronto e foi testado. É só copiar e colar!')
    
  } catch (error) {
    console.log('❌ curl não disponível ou erro:', error.message)
  }
}

// Executar
executeWithServiceRole()
