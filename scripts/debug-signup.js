const { createClient } = require('@supabase/supabase-js')

const fs = require('fs')
let url = process.env.NEXT_PUBLIC_SUPABASE_URL
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Try to load .env.local if variables are missing
if ((!url || !key) && fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [k, ...rest] = trimmed.split('=')
    const v = rest.join('=')
    const clean = v.replace(/^\"|\"$/g, '')
    if (k === 'NEXT_PUBLIC_SUPABASE_URL' && !url) url = clean
    if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !key) key = clean
  }
}

if (!url || !key) {
  console.error('Environment vars NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing')
  process.exit(2)
}

const supabase = createClient(url, key)

async function run() {
  const email = `debug+${Date.now()}@example.com`
  const password = 'Password1!'
  console.log('Attempting signup for', email)
  const res = await supabase.auth.signUp({ email, password })
  console.log('Result:', JSON.stringify(res, null, 2))
}

run().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
