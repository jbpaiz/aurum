#!/usr/bin/env node

/**
 * Script de configuração automática do Supabase
 * --------------------------------------------------
 * - Verifica se as variáveis de ambiente estão preenchidas
 * - Conecta diretamente ao banco PostgreSQL do Supabase
 * - Executa as migrations em supabase/migrations na ordem correta
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const dotenv = require('dotenv')

const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env.local')

dotenv.config({ path: envPath })

const PLACEHOLDER_PATTERNS = [
  /seuprojet/i,
  /sua_chave/i,
  /your-project/i,
  /\[SENHA\]/i,
  /\[SEU-PROJETO\]/i,
  /example\.supabase\.co/i
]

function isPlaceholder(value) {
  if (!value) return true
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

function ensureEnvVar(key, description) {
  const value = process.env[key]
  if (!value || isPlaceholder(value)) {
    console.error(`❌ Variável ${key} não está definida corretamente (${description}).`)
    return null
  }
  return value
}

function resolveDatabaseUrl() {
  const directUrl = process.env.DATABASE_URL
  if (directUrl && !isPlaceholder(directUrl)) {
    return directUrl
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD

  if (!supabaseUrl || isPlaceholder(supabaseUrl)) {
    return null
  }

  if (!dbPassword || isPlaceholder(dbPassword)) {
    return null
  }

  const projectRefMatch = supabaseUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)
  if (!projectRefMatch) {
    return null
  }

  const projectRef = projectRefMatch[1]
  return `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`
}

async function runMigrations(client) {
  const migrationsDir = path.join(projectRoot, 'supabase', 'migrations')

  if (!fs.existsSync(migrationsDir)) {
    throw new Error('Diretório supabase/migrations não encontrado')
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  console.log(`\n📦 Encontradas ${files.length} migrations. Iniciando execução...`)

  for (const file of files) {
    const sqlPath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log(`\n➡️  Executando ${file}...`)

    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('COMMIT')
      console.log(`✅ ${file} aplicada com sucesso`)
    } catch (error) {
      await client.query('ROLLBACK')

      if (/already exists|duplicate|violates unique constraint/i.test(error.message)) {
        console.warn(`⚠️  ${file} já havia sido aplicada. Pulando.`)
        continue
      }

      throw error
    }
  }
}

async function verifySeed(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS categories, (SELECT COUNT(*)::int FROM transactions) AS transactions FROM categories`
  )

  console.log('\n📊 Resumo pós-execução:')
  console.log(`   • Categorias: ${rows[0].categories}`)
  console.log(`   • Transações: ${rows[0].transactions}`)
}

async function main() {
  console.log('\n🚀 Iniciando configuração automática do Supabase...')
  console.log(`📄 Lendo variáveis em ${envPath}`)

  const supabaseUrl = ensureEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'URL pública do projeto')
  const anonKey = ensureEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Anon/public key')
  const serviceKey = ensureEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'Service role key')

  const databaseUrl = resolveDatabaseUrl()

  if (!supabaseUrl || !anonKey || !serviceKey || !databaseUrl) {
    console.error('\n❌ Configuração incompleta. Atualize o arquivo .env.local com credenciais reais e rode novamente.')
    console.error('   Guia: SUPABASE_SETUP.md')
    process.exit(1)
  }

  console.log('🔌 Conectando ao banco de dados Supabase...')

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : undefined,
  })

  try {
    await client.connect()
    console.log('✅ Conexão estabelecida com sucesso!')

    await runMigrations(client)
    await verifySeed(client)

    console.log('\n🎉 Supabase configurado com sucesso!')
    console.log('   • As tabelas principais estão prontas')
    console.log('   • Dados de exemplo foram inseridos')
    console.log('\nℹ️  Agora execute: npm run dev')
  } catch (error) {
    console.error('\n❌ Erro ao configurar o Supabase:')
    console.error(error.message)
    process.exitCode = 1
  } finally {
    await client.end().catch(() => null)
  }
}

main()
