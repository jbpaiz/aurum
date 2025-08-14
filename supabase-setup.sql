-- Criação do banco de dados para o sistema financeiro Aurum
-- Execute este script no SQL Editor do Supabase

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Em um app real, seria uma foreign key para auth.users
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO categories (name, type, color) VALUES 
-- Categorias de receita
('Salário', 'income', '#10b981'),
('Freelance', 'income', '#059669'),
('Investimentos', 'income', '#047857'),
('Vendas', 'income', '#065f46'),
('Outros', 'income', '#064e3b'),

-- Categorias de despesa
('Alimentação', 'expense', '#ef4444'),
('Transporte', 'expense', '#dc2626'),
('Moradia', 'expense', '#b91c1c'),
('Saúde', 'expense', '#991b1b'),
('Educação', 'expense', '#7f1d1d'),
('Lazer', 'expense', '#6b0f14'),
('Compras', 'expense', '#590a12'),
('Outros', 'expense', '#450a0a')

ON CONFLICT DO NOTHING;

-- Inserir algumas transações de exemplo
INSERT INTO transactions (user_id, type, amount, description, category, date) VALUES 
('1', 'income', 5000.00, 'Salário do mês', 'Salário', CURRENT_DATE - INTERVAL '1 day'),
('1', 'expense', 800.00, 'Compras no supermercado', 'Alimentação', CURRENT_DATE - INTERVAL '2 days'),
('1', 'expense', 1200.00, 'Aluguel', 'Moradia', CURRENT_DATE - INTERVAL '3 days'),
('1', 'income', 1500.00, 'Projeto freelance', 'Freelance', CURRENT_DATE - INTERVAL '5 days'),
('1', 'expense', 250.00, 'Combustível', 'Transporte', CURRENT_DATE - INTERVAL '7 days'),
('1', 'expense', 150.00, 'Cinema', 'Lazer', CURRENT_DATE - INTERVAL '10 days'),
('1', 'expense', 300.00, 'Consulta médica', 'Saúde', CURRENT_DATE - INTERVAL '15 days'),
('1', 'income', 800.00, 'Dividendos', 'Investimentos', CURRENT_DATE - INTERVAL '20 days')

ON CONFLICT DO NOTHING;
