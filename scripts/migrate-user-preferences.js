const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function executeMigration() {
  console.log('🚀 Executando migration: user_preferences\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/20241203000001_create_user_preferences.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Erro ao executar migration:', error)
      process.exit(1)
    }

    console.log('✅ Migration executada com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Regenerar types do Supabase: npx supabase gen types typescript --project-id difntzsqjzhswyubprsc > src/types/supabase.ts')
    console.log('2. Ou usar o comando: npm run generate-types')
    
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

executeMigration()
