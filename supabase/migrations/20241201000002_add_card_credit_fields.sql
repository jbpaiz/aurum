-- Adicionar campos de crédito aos cartões
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_day INTEGER,
ADD COLUMN IF NOT EXISTS closing_day INTEGER;

-- Adicionar comentários
COMMENT ON COLUMN cards.credit_limit IS 'Limite do cartão de crédito';
COMMENT ON COLUMN cards.current_balance IS 'Saldo/fatura atual (positivo = deve, negativo = crédito)';
COMMENT ON COLUMN cards.due_day IS 'Dia de vencimento da fatura (1-31)';
COMMENT ON COLUMN cards.closing_day IS 'Dia de fechamento da fatura (1-31)';

-- Adicionar constraints para validar os dias
ALTER TABLE cards
ADD CONSTRAINT check_due_day CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
ADD CONSTRAINT check_closing_day CHECK (closing_day IS NULL OR (closing_day >= 1 AND closing_day <= 31));
