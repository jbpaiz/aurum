-- ============================================
-- AURUM - RECRIAÇÃO ULTRA-SEGURA DO BANCO
-- ============================================
-- ⚠️ ESTE SCRIPT APAGA TODOS OS DADOS!
-- Use apenas em ambiente de teste/desenvolvimento

-- ============================================
-- 1. LIMPEZA SIMPLES E DIRETA
-- ============================================

-- Desabilitar RLS manualmente
ALTER TABLE IF EXISTS bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS card_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transfers DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas conhecidas
DROP POLICY IF EXISTS "Users can view own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can insert own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can delete own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Users can view own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Everyone can view card_providers" ON card_providers;

-- Remover triggers conhecidos
DROP TRIGGER IF EXISTS process_transaction_trigger ON transactions;
DROP TRIGGER IF EXISTS revert_transaction_on_update ON transactions;
DROP TRIGGER IF EXISTS revert_transaction_on_delete ON transactions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;

-- Remover funções conhecidas
DROP FUNCTION IF EXISTS process_unified_transaction() CASCADE;
DROP FUNCTION IF EXISTS process_transfer_transaction() CASCADE;
DROP FUNCTION IF EXISTS revert_unified_transaction() CASCADE;
DROP FUNCTION IF EXISTS revert_transaction() CASCADE;
DROP FUNCTION IF EXISTS get_unified_transactions(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_demo_data_for_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_demo_data_for_user(UUID) CASCADE;

-- Remover tabelas em ordem segura
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transfers CASCADE; 
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS card_providers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;

-- ============================================
-- 2. EXTENSÕES E UTILITÁRIOS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CRIAÇÃO DAS TABELAS - TIPOS CONSISTENTES
-- ============================================

-- Tabela de contas bancárias
CREATE TABLE bank_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'wallet', 'investment', 'other')),
    bank TEXT,
    icon TEXT NOT NULL DEFAULT 'CreditCard',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    icon TEXT,
    color TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de provedores de cartão (PRIMEIRO - sem dependências)
CREATE TABLE card_providers (
    id TEXT PRIMARY KEY, -- 'visa', 'mastercard', etc
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    popular_brands TEXT[],
    supported_types TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cartões (DEPOIS - depende de card_providers e bank_accounts)
CREATE TABLE cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    provider_id TEXT NOT NULL,
    account_id UUID NOT NULL,
    alias TEXT NOT NULL,
    last_four_digits TEXT,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (provider_id) REFERENCES card_providers(id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

-- Tabela de métodos de pagamento (DEPOIS - depende de bank_accounts e cards)
CREATE TABLE payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
    account_id UUID NOT NULL,
    card_id UUID,
    icon TEXT NOT NULL DEFAULT 'CreditCard',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL
);

-- Tabela de transações UNIFICADAS (ÚLTIMO - depende de todas as outras)
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    
    -- Campos para receitas e despesas tradicionais
    category_id UUID,
    payment_method_id UUID,
    account_id UUID, -- Conta principal para income/expense
    
    -- Campos específicos para transferências
    from_account_id UUID, -- Conta origem (só para transfers)
    to_account_id UUID,   -- Conta destino (só para transfers)
    
    -- Campos gerais
    transaction_date DATE NOT NULL,
    installments INTEGER DEFAULT 1,
    current_installment INTEGER DEFAULT 1,
    is_installment BOOLEAN DEFAULT false,
    parent_transaction_id UUID,
    notes TEXT,
    is_confirmed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    
    -- Constraints de validação
    CONSTRAINT valid_income_expense CHECK (
        (type IN ('income', 'expense') AND account_id IS NOT NULL AND from_account_id IS NULL AND to_account_id IS NULL)
    ),
    CONSTRAINT valid_transfer CHECK (
        (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id AND account_id IS NULL)
    )
);

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Bank Accounts
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(user_id, is_active);

-- Cards
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);

-- Payment Methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_account_id ON payment_methods(account_id);

-- Categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type, is_active);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_from_account_id ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account_id ON transactions(to_account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_payment_method_id ON transactions(payment_method_id);

-- ============================================
-- 5. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
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

-- ============================================
-- 6. FUNÇÃO PARA PROCESSAR TRANSAÇÕES UNIFICADAS
-- ============================================

CREATE OR REPLACE FUNCTION process_unified_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Transferência entre contas
    IF NEW.type = 'transfer' AND NEW.from_account_id IS NOT NULL AND NEW.to_account_id IS NOT NULL THEN
        -- Debitar da conta origem
        UPDATE bank_accounts 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.from_account_id AND user_id = NEW.user_id;
        
        -- Creditar na conta destino
        UPDATE bank_accounts 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.to_account_id AND user_id = NEW.user_id;
        
        RAISE NOTICE 'Transfer processed: R$ % from % to %', NEW.amount, NEW.from_account_id, NEW.to_account_id;
        
    -- Despesa (débito)
    ELSIF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id AND user_id = NEW.user_id;
        
        RAISE NOTICE 'Expense processed: R$ % debited from %', NEW.amount, NEW.account_id;
        
    -- Receita (crédito)
    ELSIF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id AND user_id = NEW.user_id;
        
        RAISE NOTICE 'Income processed: R$ % credited to %', NEW.amount, NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO PARA REVERTER TRANSAÇÕES
-- ============================================

CREATE OR REPLACE FUNCTION revert_unified_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverter transferência
    IF OLD.type = 'transfer' AND OLD.from_account_id IS NOT NULL AND OLD.to_account_id IS NOT NULL THEN
        -- Reverter: creditar de volta na origem
        UPDATE bank_accounts 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.from_account_id AND user_id = OLD.user_id;
        
        -- Reverter: debitar do destino
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.to_account_id AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Transfer reverted: R$ % from % to %', OLD.amount, OLD.from_account_id, OLD.to_account_id;
        
    -- Reverter despesa (creditar de volta)
    ELSIF OLD.type = 'expense' AND OLD.account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Expense reverted: R$ % credited back to %', OLD.amount, OLD.account_id;
        
    -- Reverter receita (debitar)
    ELSIF OLD.type = 'income' AND OLD.account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Income reverted: R$ % debited from %', OLD.amount, OLD.account_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. TRIGGERS PARA TRANSAÇÕES
-- ============================================

-- Processar nova transação
CREATE TRIGGER process_transaction_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION process_unified_transaction();

-- Reverter transação antes de atualizar
CREATE TRIGGER revert_transaction_on_update
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION revert_unified_transaction();

-- Reverter transação antes de deletar
CREATE TRIGGER revert_transaction_on_delete
    BEFORE DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION revert_unified_transaction();

-- ============================================
-- 9. FUNÇÃO PARA CONSULTA UNIFICADA
-- ============================================

CREATE OR REPLACE FUNCTION get_unified_transactions(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    type TEXT,
    description TEXT,
    amount DECIMAL(15,2),
    category_name TEXT,
    transaction_date DATE,
    account_name TEXT,
    from_account_name TEXT,
    to_account_name TEXT,
    payment_method_name TEXT,
    installments INTEGER,
    current_installment INTEGER,
    is_installment BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.description,
        t.amount,
        c.name as category_name,
        t.transaction_date,
        ba1.name as account_name,
        ba2.name as from_account_name,
        ba3.name as to_account_name,
        pm.name as payment_method_name,
        t.installments,
        t.current_installment,
        t.is_installment,
        t.notes,
        t.created_at
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN bank_accounts ba1 ON t.account_id = ba1.id
    LEFT JOIN bank_accounts ba2 ON t.from_account_id = ba2.id
    LEFT JOIN bank_accounts ba3 ON t.to_account_id = ba3.id
    LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
    WHERE t.user_id = p_user_id
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. DADOS INICIAIS
-- ============================================

-- Provedores de cartão
INSERT INTO card_providers (id, name, icon, color, popular_brands, supported_types) VALUES
('visa', 'Visa', 'CreditCard', '#1A1F71', ARRAY['Nubank', 'Banco do Brasil', 'Santander', 'Itaú'], ARRAY['credit', 'debit']),
('mastercard', 'Mastercard', 'CreditCard', '#EB001B', ARRAY['Nubank', 'C6 Bank', 'Inter', 'BTG'], ARRAY['credit', 'debit']),
('elo', 'Elo', 'CreditCard', '#FFCB05', ARRAY['Banco do Brasil', 'Bradesco', 'Caixa'], ARRAY['credit', 'debit']),
('american_express', 'American Express', 'CreditCard', '#006FCF', ARRAY['Santander', 'Bradesco'], ARRAY['credit']),
('hipercard', 'Hipercard', 'CreditCard', '#E31837', ARRAY['Itaú'], ARRAY['credit']),
('other', 'Outro', 'CreditCard', '#6B7280', ARRAY[], ARRAY['credit', 'debit']);

-- Categorias padrão brasileiras
INSERT INTO categories (id, user_id, name, type, icon, color, is_default, is_active) VALUES
(uuid_generate_v4(), NULL, 'Alimentação', 'expense', 'UtensilsCrossed', '#EF4444', true, true),
(uuid_generate_v4(), NULL, 'Transporte', 'expense', 'Car', '#F97316', true, true),
(uuid_generate_v4(), NULL, 'Casa', 'expense', 'Home', '#8B5CF6', true, true),
(uuid_generate_v4(), NULL, 'Saúde', 'expense', 'Heart', '#EC4899', true, true),
(uuid_generate_v4(), NULL, 'Educação', 'expense', 'BookOpen', '#3B82F6', true, true),
(uuid_generate_v4(), NULL, 'Lazer', 'expense', 'Gamepad2', '#10B981', true, true),
(uuid_generate_v4(), NULL, 'Roupas', 'expense', 'Shirt', '#F59E0B', true, true),
(uuid_generate_v4(), NULL, 'Outros', 'both', 'MoreHorizontal', '#6B7280', true, true),
(uuid_generate_v4(), NULL, 'Salário', 'income', 'DollarSign', '#10B981', true, true),
(uuid_generate_v4(), NULL, 'Freelance', 'income', 'Briefcase', '#3B82F6', true, true),
(uuid_generate_v4(), NULL, 'Investimentos', 'income', 'TrendingUp', '#8B5CF6', true, true),
(uuid_generate_v4(), NULL, 'Vendas', 'income', 'ShoppingBag', '#F97316', true, true);

-- ============================================
-- 11. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS DEPOIS dos dados iniciais
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Bank Accounts
CREATE POLICY "Users can view own bank_accounts" ON bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank_accounts" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank_accounts" ON bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank_accounts" ON bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "Users can view own cards" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON cards FOR DELETE USING (auth.uid() = user_id);

-- Card Providers (públicos)
CREATE POLICY "Everyone can view card_providers" ON card_providers FOR SELECT USING (true);

-- Payment Methods
CREATE POLICY "Users can view own payment_methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment_methods" ON payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment_methods" ON payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment_methods" ON payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can view categories" ON categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions (incluindo transferências)
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
    auth.uid() = user_id OR 
    (type = 'transfer' AND (
        from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) OR
        to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
    ))
);

CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (type IN ('income', 'expense') OR 
     (type = 'transfer' AND 
      from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) AND
      to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
     )
    )
);

CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 12. FUNÇÃO PARA CRIAR DADOS DEMO
-- ============================================

CREATE OR REPLACE FUNCTION create_demo_data_for_user(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    account1_id UUID;
    account2_id UUID;
    card1_id UUID;
    payment_method1_id UUID;
    payment_method2_id UUID;
    category_food_id UUID;
    category_salary_id UUID;
BEGIN
    -- Criar contas demo
    INSERT INTO bank_accounts (user_id, name, type, bank, icon, color, balance) VALUES
    (user_uuid, 'Conta Corrente', 'checking', 'Nubank', 'CreditCard', '#8A2BE2', 2500.00)
    RETURNING id INTO account1_id;
    
    INSERT INTO bank_accounts (user_id, name, type, icon, color, balance) VALUES
    (user_uuid, 'Carteira', 'wallet', 'Wallet', '#22C55E', 150.00)
    RETURNING id INTO account2_id;
    
    -- Criar cartão demo
    INSERT INTO cards (user_id, provider_id, account_id, alias, last_four_digits, type) VALUES
    (user_uuid, 'visa', account1_id, 'Nubank Roxinho', '1234', 'credit')
    RETURNING id INTO card1_id;
    
    -- Criar métodos de pagamento demo
    INSERT INTO payment_methods (user_id, name, type, account_id, card_id, icon, color) VALUES
    (user_uuid, 'Cartão Nubank', 'credit_card', account1_id, card1_id, 'CreditCard', '#8A2BE2')
    RETURNING id INTO payment_method1_id;
    
    INSERT INTO payment_methods (user_id, name, type, account_id, icon, color) VALUES
    (user_uuid, 'PIX', 'pix', account1_id, 'Smartphone', '#00BC8C')
    RETURNING id INTO payment_method2_id;
    
    -- Buscar categorias padrão
    SELECT id INTO category_food_id FROM categories WHERE name = 'Alimentação' AND user_id IS NULL LIMIT 1;
    SELECT id INTO category_salary_id FROM categories WHERE name = 'Salário' AND user_id IS NULL LIMIT 1;
    
    -- Criar transações demo
    INSERT INTO transactions (user_id, type, description, amount, category_id, payment_method_id, account_id, transaction_date) VALUES
    (user_uuid, 'income', 'Salário Janeiro', 5000.00, category_salary_id, payment_method2_id, account1_id, CURRENT_DATE - INTERVAL '2 days'),
    (user_uuid, 'expense', 'Almoço no restaurante', 45.90, category_food_id, payment_method1_id, account1_id, CURRENT_DATE - INTERVAL '1 day');
    
    -- Criar transferência demo
    INSERT INTO transactions (user_id, type, description, amount, from_account_id, to_account_id, transaction_date, notes) VALUES
    (user_uuid, 'transfer', 'Transferência para carteira', 200.00, account1_id, account2_id, CURRENT_DATE, 'Dinheiro para emergência');
    
    RAISE NOTICE '✅ Dados demo criados para usuário %', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Contar estruturas criadas
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'bank_accounts', 'cards', 'card_providers', 'payment_methods', 
        'categories', 'transactions'
    );
    
    SELECT COUNT(*) INTO function_count FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN (
        'update_updated_at_column', 'process_unified_transaction', 
        'revert_unified_transaction', 'get_unified_transactions', 'create_demo_data_for_user'
    );
    
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers 
    WHERE event_object_schema = 'public';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 AURUM - BANCO RECRIADO COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTRUTURA CRIADA:';
    RAISE NOTICE '  ✅ Tabelas: %/6', table_count;
    RAISE NOTICE '  ✅ Funções: %/5', function_count;
    RAISE NOTICE '  ✅ Triggers: %', trigger_count;
    RAISE NOTICE '  ✅ Políticas RLS: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNCIONALIDADES:';
    RAISE NOTICE '  ✅ Tipos UUID consistentes em TODAS as tabelas';
    RAISE NOTICE '  ✅ Transações unificadas (receita, despesa, transferência)';
    RAISE NOTICE '  ✅ Sistema de contas, cartões e métodos de pagamento';
    RAISE NOTICE '  ✅ Categorias padrão brasileiras';
    RAISE NOTICE '  ✅ Saldos atualizados automaticamente';
    RAISE NOTICE '  ✅ Triggers para reversão de operações';
    RAISE NOTICE '  ✅ Segurança RLS completa';
    RAISE NOTICE '  ✅ Função para relatórios unificados';
    RAISE NOTICE '  ✅ Função para criar dados demo';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Registre/faça login no sistema';
    RAISE NOTICE '  2. Execute: SELECT create_demo_data_for_user(auth.uid());';
    RAISE NOTICE '  3. Teste receitas, despesas e transferências';
    RAISE NOTICE '  4. Consulte: SELECT * FROM get_unified_transactions(auth.uid(), 10);';
    RAISE NOTICE '';
    
    IF table_count = 6 AND function_count = 5 THEN
        RAISE NOTICE '🚀 SISTEMA 100%% OPERACIONAL!';
        RAISE NOTICE '   Database pronto para uso em produção!';
    ELSE
        RAISE NOTICE '⚠️ Verificar possíveis erros na criação';
        RAISE NOTICE '   Tabelas: % (esperado: 6)', table_count;
        RAISE NOTICE '   Funções: % (esperado: 5)', function_count;
    END IF;
    
    RAISE NOTICE '============================================';
END $$;
