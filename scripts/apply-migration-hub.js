const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migração de last_active_hub...\n')

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260120000001_update_last_active_hub_constraint.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Erro ao executar migração:', error.message)
      console.log('\n📝 Executando SQL direto...\n')
      
      // Tentar executar linha por linha
      const lines = sql.split(';').filter(l => l.trim())
      for (const line of lines) {
        if (line.trim()) {
          console.log(`Executando: ${line.trim().substring(0, 50)}...`)
          const { error: lineError } = await supabase.rpc('exec_sql', { sql_query: line })
          if (lineError) {
            console.error('Erro:', lineError.message)
          } else {
            console.log('✅ OK')
          }
        }
      }
    } else {
      console.log('✅ Migração aplicada com sucesso!')
    }

  } catch (err) {
    console.error('❌ Erro:', err.message)
    process.exit(1)
  }
}

applyMigration()
