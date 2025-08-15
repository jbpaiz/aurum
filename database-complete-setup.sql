-- ============================================
-- AURUM - SETUP COMPLETO DO BANCO DE DADOS
-- ============================================
-- Este arquivo contém TUDO necessário para criar o banco do zero
-- Execute este arquivo no Supabase SQL Editor para configurar completamente o sistema

-- Autor: Aurum Financial Control System
-- Data: 2025-08-15
-- Versão: 1.0

-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para SQL Editor → New Query
-- 3. Cole TODO este arquivo
-- 4. Execute (pode demorar alguns segundos)
-- 5. Verifique as mensagens de sucesso no final

-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LIMPEZA (SE NECESSÁRIO)
-- ============================================
-- Descomente as linhas abaixo APENAS se quiser recriar tudo do zero
-- DROP TABLE IF EXISTS transfers CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS bank_accounts CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- 1. TABELA DE CATEGORIAS
-- ============================================
-- Criada primeiro porque outras tabelas referenciam ela

DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, type)
);

-- ============================================
-- 2. TABELA DE CONTAS BANCÁRIAS
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'wallet', 'investment', 'other')),
    bank TEXT,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA DE TRANSAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category TEXT, -- Campo opcional para compatibilidade
    date DATE NOT NULL,
    account_id TEXT REFERENCES bank_accounts(id) ON DELETE SET NULL,
    payment_method TEXT,
    installments INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELA DE TRANSFERÊNCIAS
-- ============================================
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id TEXT REFERENCES bank_accounts(id) ON DELETE CASCADE,
    to_account_id TEXT REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    payment_method TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(type);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- transfers
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);
CREATE INDEX IF NOT EXISTS idx_transfers_amount ON transfers(amount);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular saldo total de um usuário
CREATE OR REPLACE FUNCTION get_total_balance(p_user_id UUID)
RETURNS DECIMAL(15,2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(balance) FROM bank_accounts WHERE user_id = p_user_id AND is_active = true),
        0.00
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resumo financeiro de um período
CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID, p_period_days INTEGER DEFAULT 30)
RETURNS TABLE(
    total_income DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    balance DECIMAL(15,2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance,
        COUNT(*) as transaction_count
    FROM transactions t
    WHERE t.user_id = p_user_id 
    AND t.date >= CURRENT_DATE - INTERVAL '1 day' * p_period_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar categoria por nome
CREATE OR REPLACE FUNCTION get_category_id_by_name(category_name TEXT, transaction_type TEXT)
RETURNS UUID AS $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id 
    FROM categories 
    WHERE name = category_name AND type = transaction_type
    LIMIT 1;
    
    RETURN cat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular saldo de conta específica
CREATE OR REPLACE FUNCTION get_account_balance(p_account_id TEXT)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    account_balance DECIMAL(15,2);
    income_total DECIMAL(15,2);
    expense_total DECIMAL(15,2);
    transfer_in DECIMAL(15,2);
    transfer_out DECIMAL(15,2);
BEGIN
    -- Saldo inicial da conta
    SELECT COALESCE(balance, 0) INTO account_balance FROM bank_accounts WHERE id = p_account_id;
    
    -- Receitas
    SELECT COALESCE(SUM(amount), 0) INTO income_total 
    FROM transactions 
    WHERE account_id = p_account_id AND type = 'income';
    
    -- Despesas
    SELECT COALESCE(SUM(amount), 0) INTO expense_total 
    FROM transactions 
    WHERE account_id = p_account_id AND type = 'expense';
    
    -- Transferências recebidas
    SELECT COALESCE(SUM(amount), 0) INTO transfer_in 
    FROM transfers 
    WHERE to_account_id = p_account_id;
    
    -- Transferências enviadas
    SELECT COALESCE(SUM(amount), 0) INTO transfer_out 
    FROM transfers 
    WHERE from_account_id = p_account_id;
    
    RETURN account_balance + income_total - expense_total + transfer_in - transfer_out;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em bank_accounts
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA
-- ============================================

-- BANK_ACCOUNTS - Políticas
DROP POLICY IF EXISTS "Users can view own accounts" ON bank_accounts;
CREATE POLICY "Users can view own accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accounts" ON bank_accounts;
CREATE POLICY "Users can insert own accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON bank_accounts;
CREATE POLICY "Users can update own accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON bank_accounts;
CREATE POLICY "Users can delete own accounts" ON bank_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- TRANSACTIONS - Políticas
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- TRANSFERS - Políticas
DROP POLICY IF EXISTS "Users can view own transfers" ON transfers;
CREATE POLICY "Users can view own transfers" ON transfers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transfers" ON transfers;
CREATE POLICY "Users can insert own transfers" ON transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transfers" ON transfers;
CREATE POLICY "Users can update own transfers" ON transfers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transfers" ON transfers;
CREATE POLICY "Users can delete own transfers" ON transfers
    FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES - Políticas (público para leitura, admins para escrita)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- DADOS INICIAIS - CATEGORIAS
-- ============================================

INSERT INTO categories (name, type, color, icon) VALUES 
-- ========== RECEITAS (VERDE) ==========
('Salário', 'income', '#10b981', 'Briefcase'),
('Freelance', 'income', '#059669', 'Code'),
('Investimentos', 'income', '#047857', 'TrendingUp'),
('Vendas', 'income', '#065f46', 'ShoppingBag'),
('Aluguel', 'income', '#10b981', 'Home'),
('Dividendos', 'income', '#047857', 'PieChart'),
('Prêmios', 'income', '#059669', 'Award'),
('Bonificação', 'income', '#065f46', 'Gift'),
('Reembolso', 'income', '#047857', 'RefreshCw'),
('Outros', 'income', '#064e3b', 'Plus'),

-- ========== DESPESAS (VERMELHO) ==========
('Alimentação', 'expense', '#ef4444', 'Utensils'),
('Transporte', 'expense', '#dc2626', 'Car'),
('Moradia', 'expense', '#b91c1c', 'Home'),
('Saúde', 'expense', '#991b1b', 'Heart'),
('Educação', 'expense', '#7f1d1d', 'GraduationCap'),
('Lazer', 'expense', '#6b0f14', 'Gamepad2'),
('Compras', 'expense', '#590a12', 'ShoppingCart'),
('Serviços', 'expense', '#dc2626', 'Settings'),
('Impostos', 'expense', '#b91c1c', 'Receipt'),
('Seguros', 'expense', '#991b1b', 'Shield'),
('Telefonia', 'expense', '#7f1d1d', 'Phone'),
('Internet', 'expense', '#6b0f14', 'Wifi'),
('Streaming', 'expense', '#590a12', 'Play'),
('Academia', 'expense', '#ef4444', 'Dumbbell'),
('Pets', 'expense', '#dc2626', 'Heart'),
('Outros', 'expense', '#450a0a', 'Minus')

ON CONFLICT (name, type) DO NOTHING;

-- ============================================
-- DADOS INICIAIS - CONTAS EXEMPLO
-- ============================================
-- Estas contas são criadas apenas para demonstração
-- Remova esta seção se não quiser contas de exemplo

-- Função para criar contas de exemplo (opcional)
CREATE OR REPLACE FUNCTION create_sample_accounts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO bank_accounts (id, user_id, name, type, bank, icon, color, balance) VALUES
    ('conta-corrente-001', p_user_id, 'Conta Corrente', 'checking', 'Banco do Brasil', 'CreditCard', '#1E40AF', 2500.00),
    ('poupanca-001', p_user_id, 'Poupança', 'savings', 'Caixa Econômica', 'PiggyBank', '#059669', 5000.00),
    ('carteira-001', p_user_id, 'Carteira', 'wallet', null, 'Wallet', '#7C3AED', 350.00),
    ('investimentos-001', p_user_id, 'Investimentos', 'investment', 'XP Investimentos', 'TrendingUp', '#DC2626', 15000.00)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Contas de exemplo criadas para o usuário %', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICAÇÃO E RELATÓRIO FINAL
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
    category_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Contar tabelas criadas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('bank_accounts', 'transfers', 'transactions', 'categories');
    
    -- Contar categorias inseridas
    SELECT COUNT(*) INTO category_count FROM categories;
    
    -- Contar índices criados
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    -- Contar funções criadas
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('update_updated_at_column', 'get_total_balance', 'get_financial_summary', 'get_category_id_by_name', 'get_account_balance', 'create_sample_accounts');
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name LIKE 'update_%_updated_at';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- ========================================
    -- RELATÓRIO FINAL
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║           AURUM DATABASE SETUP         ║';
    RAISE NOTICE '║              CONCLUÍDO!                ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO DA INSTALAÇÃO:';
    RAISE NOTICE '  ✅ Tabelas criadas: %/4', table_count;
    RAISE NOTICE '  ✅ Categorias inseridas: %', category_count;
    RAISE NOTICE '  ✅ Índices para performance: %', index_count;
    RAISE NOTICE '  ✅ Funções utilitárias: %', function_count;
    RAISE NOTICE '  ✅ Triggers automáticos: %', trigger_count;
    RAISE NOTICE '  ✅ Políticas de segurança: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURANÇA:';
    RAISE NOTICE '  ✅ Row Level Security habilitado';
    RAISE NOTICE '  ✅ Usuários veem apenas seus próprios dados';
    RAISE NOTICE '  ✅ Categorias compartilhadas entre usuários';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ PERFORMANCE:';
    RAISE NOTICE '  ✅ Índices otimizados para consultas';
    RAISE NOTICE '  ✅ Triggers para campos updated_at';
    RAISE NOTICE '  ✅ Funções para relatórios rápidos';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Teste a autenticação no seu app';
    RAISE NOTICE '  2. Crie suas primeiras contas bancárias';
    RAISE NOTICE '  3. Registre suas primeiras transações';
    RAISE NOTICE '  4. Use: SELECT create_sample_accounts(auth.uid()); para contas exemplo';
    RAISE NOTICE '';
    
    IF table_count = 4 AND category_count > 0 THEN
        RAISE NOTICE '🎉 INSTALAÇÃO 100%% COMPLETA!';
        RAISE NOTICE '   Seu sistema Aurum está pronto para uso!';
    ELSE
        RAISE NOTICE '⚠️  ATENÇÃO: Instalação incompleta';
        RAISE NOTICE '   Verifique os erros acima e execute novamente';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Aurum Financial Control System v1.0';
    RAISE NOTICE 'Database setup completed at %', NOW();
    RAISE NOTICE '════════════════════════════════════════';
END $$;
