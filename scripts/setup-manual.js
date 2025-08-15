require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupBasicStructure() {
  console.log('🚀 Configurando estrutura básica do banco...')
  console.log('')

  try {
    // Tentar criar algumas tabelas básicas via interface do Supabase
    console.log('📋 Para configurar o banco de dados, você precisa:')
    console.log('')
    console.log('1. 🌐 Acesse: https://supabase.com/dashboard/projects')
    console.log('2. 🖱️ Clique no seu projeto: difntzsqjzhswyubprsc')
    console.log('3. 📝 Vá em "SQL Editor" no menu lateral')
    console.log('4. ✨ Copie e execute este SQL:')
    console.log('')
    console.log('-------- COPIE O SQL ABAIXO --------')
    console.log('')
    
    const basicSQL = `
-- Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'wallet', 'other')),
  bank TEXT,
  icon TEXT DEFAULT '🏦',
  color TEXT DEFAULT '#6B7280',
  balance DECIMAL(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Tabela de métodos de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  card_id UUID,
  icon TEXT DEFAULT '💳',
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

    console.log(basicSQL)
    console.log('')
    console.log('-------- FIM DO SQL --------')
    console.log('')
    console.log('5. ▶️ Clique em "Run" para executar')
    console.log('6. ✅ Aguarde a mensagem de sucesso')
    console.log('7. 🔄 Execute novamente: node scripts/test-supabase.js')
    console.log('')
    console.log('💡 Alternativamente, você pode salvar o SQL acima em um arquivo e usar o SQL Editor')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

setupBasicStructure()
