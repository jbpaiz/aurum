-- ================================================
-- AURUM FINANCIAL CONTROL DATABASE STRUCTURE
-- ================================================

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ================================================
-- 1. CONTAS BANCÁRIAS (Bank Accounts)
-- ================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('checking', 'savings', 'wallet', 'investment', 'other')) NOT NULL,
    bank VARCHAR(50),
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 2. PROVEDORES DE CARTÃO (Card Providers)
-- ================================================
CREATE TABLE IF NOT EXISTS card_providers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    popular_brands TEXT[], -- Array de marcas populares
    supported_types TEXT[] CHECK (supported_types <@ ARRAY['credit', 'debit']), -- Array de tipos suportados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. CARTÕES (Credit/Debit Cards)
-- ================================================
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) REFERENCES card_providers(id),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL,
    last_four_digits VARCHAR(4),
    type VARCHAR(10) CHECK (type IN ('credit', 'debit')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON cards
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 4. MÉTODOS DE PAGAMENTO (Payment Methods)
-- ================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')) NOT NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 5. CATEGORIAS (Categories)
-- ================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(7),
    is_default BOOLEAN DEFAULT false, -- Categorias padrão do sistema
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- ================================================
-- 6. TRANSAÇÕES (Transactions)
-- ================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    installments INTEGER DEFAULT 1,
    current_installment INTEGER DEFAULT 1,
    is_installment BOOLEAN DEFAULT false,
    parent_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    notes TEXT,
    is_confirmed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 7. TRANSFERÊNCIAS (Transfers)
-- ================================================
CREATE TABLE IF NOT EXISTS transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    transfer_date DATE NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0.00,
    from_transaction_id UUID REFERENCES transactions(id),
    to_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar transferência para a mesma conta
    CONSTRAINT different_accounts CHECK (from_account_id != to_account_id)
);

-- RLS para transfers
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transfers" ON transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transfers" ON transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transfers" ON transfers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transfers" ON transfers
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 8. ORÇAMENTOS (Budgets)
-- ================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices para bank_accounts
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_type ON bank_accounts(type);
CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);

-- Índices para cards
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_provider_id ON cards(provider_id);
CREATE INDEX idx_cards_type ON cards(type);

-- Índices para payment_methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_account_id ON payment_methods(account_id);
CREATE INDEX idx_payment_methods_card_id ON payment_methods(card_id);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);

-- Índices para transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_parent ON transactions(parent_transaction_id);

-- Índices para transfers
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

-- ================================================
-- TRIGGERS PARA UPDATED_AT
-- ================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função para atualizar saldo da conta
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é uma nova transação
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' THEN
            UPDATE bank_accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSE
            UPDATE bank_accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Se é uma atualização
    IF TG_OP = 'UPDATE' THEN
        -- Reverter transação antiga
        IF OLD.type = 'income' THEN
            UPDATE bank_accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSE
            UPDATE bank_accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        
        -- Aplicar nova transação
        IF NEW.type = 'income' THEN
            UPDATE bank_accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSE
            UPDATE bank_accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Se é uma exclusão
    IF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income' THEN
            UPDATE bank_accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSE
            UPDATE bank_accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização automática de saldo
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();
