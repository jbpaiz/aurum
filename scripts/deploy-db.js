const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');
const { spawnSync } = require('child_process');

const envPath = resolve(process.cwd(), '.env.prod');

if (!existsSync(envPath)) {
  console.error('Erro: arquivo .env.prod não encontrado na raiz do projeto.');
  console.error('Crie um .env.prod a partir de .env.prod.example antes de rodar este comando.');
  process.exit(1);
}

const fileContent = readFileSync(envPath, 'utf8');
fileContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const [key, ...valueParts] = trimmed.split('=');
  if (!key) return;
  const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

const dbUrl = process.env.SUPABASE_REMOTE_DB_URL;
if (!dbUrl) {
  console.error('Erro: variável SUPABASE_REMOTE_DB_URL não definida no .env.prod.');
  process.exit(1);
}

const extraArgs = process.argv.slice(2);
const cliArgs = ['supabase', 'db', 'push', '--db-url', dbUrl, ...extraArgs];
const result = spawnSync('npx', cliArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
