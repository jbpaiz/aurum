-- =====================================================
-- AURUM - ESTRUTURA COMPLETA DO BANCO DE DADOS
-- =====================================================
-- Este arquivo contém toda a estrutura necessária para o sistema financeiro Aurum
-- Execute este script no SQL Editor do Supabase para configurar o banco

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
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON bank_accounts;
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
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON payment_methods;
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
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
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
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Tabela de cartões (se não existir)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  provider TEXT NOT NULL,
  last_digits TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '💳',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cards" ON cards;
CREATE POLICY "Users can manage their own cards" ON cards
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
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para inserir categorias padrão
CREATE OR REPLACE FUNCTION insert_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Categorias de receita
  INSERT INTO categories (user_id, name, type, icon, color) VALUES
    (user_uuid, 'Salário', 'income', '💰', '#10B981'),
    (user_uuid, 'Freelance', 'income', '💼', '#059669'),
    (user_uuid, 'Investimentos', 'income', '📈', '#0D9488'),
    (user_uuid, 'Outros', 'income', '💵', '#06B6D4');

  -- Categorias de despesas
  INSERT INTO categories (user_id, name, type, icon, color) VALUES
    (user_uuid, 'Alimentação', 'expense', '🍽️', '#EF4444'),
    (user_uuid, 'Transporte', 'expense', '🚗', '#F97316'),
    (user_uuid, 'Moradia', 'expense', '🏠', '#F59E0B'),
    (user_uuid, 'Saúde', 'expense', '🏥', '#84CC16'),
    (user_uuid, 'Educação', 'expense', '📚', '#06B6D4'),
    (user_uuid, 'Lazer', 'expense', '🎯', '#8B5CF6'),
    (user_uuid, 'Compras', 'expense', '🛍️', '#EC4899'),
    (user_uuid, 'Contas', 'expense', '📄', '#6B7280'),
    (user_uuid, 'Outros', 'expense', '📦', '#64748B');
END;
$$ language 'plpgsql';

-- =====================================================
-- ✅ ESTRUTURA CRIADA COM SUCESSO!
-- =====================================================
-- Agora execute: node scripts/test-supabase.js para verificar se tudo está funcionando
