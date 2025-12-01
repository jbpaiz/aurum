-- Corrigir constraints de transferência
-- A constraint valid_income_expense está bloqueando transferências

-- Remover constraints antigas
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS valid_income_expense;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS valid_transfer;

-- Recriar constraints corrigidas
ALTER TABLE transactions ADD CONSTRAINT valid_income_expense CHECK (
    (type IN ('income', 'expense') AND account_id IS NOT NULL AND from_account_id IS NULL AND to_account_id IS NULL)
    OR type = 'transfer'
);

ALTER TABLE transactions ADD CONSTRAINT valid_transfer CHECK (
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id AND account_id IS NULL)
    OR type IN ('income', 'expense')
);

-- Comentários
COMMENT ON CONSTRAINT valid_income_expense ON transactions IS 'Valida que receitas/despesas tenham account_id, e permite transferências';
COMMENT ON CONSTRAINT valid_transfer ON transactions IS 'Valida que transferências tenham from/to accounts diferentes e account_id NULL';
