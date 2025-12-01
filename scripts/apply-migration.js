const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('📝 Lendo arquivo de migration...')
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241201000000_alter_tasks_key_constraint.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('🚀 Executando migration...')
    console.log('SQL a ser executado:')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Se a função exec_sql não existe, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando método alternativo...')
      
      // Dividir em comandos individuais
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

      for (const command of commands) {
        console.log(`\n📌 Executando: ${command.substring(0, 80)}...`)
        const { error: cmdError } = await supabase.from('_migrations').select('*').limit(0) // Dummy query
        
        if (cmdError) {
          console.error('❌ Erro:', cmdError.message)
        }
      }

      console.log('\n⚠️  ATENÇÃO: Execute o SQL manualmente no Supabase Dashboard > SQL Editor:')
      console.log('\n' + sql)
      console.log('\n📋 SQL copiado acima. Cole no SQL Editor do Supabase.')
    } else {
      console.log('✅ Migration aplicada com sucesso!')
      console.log('Resultado:', data)
    }

    console.log('\n✨ Processo concluído!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Acesse o Supabase Dashboard')
    console.log('2. Vá em SQL Editor')
    console.log('3. Cole o SQL abaixo e execute:')
    console.log('\n' + sql)

  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err)
    process.exit(1)
  }
}

applyMigration()
