-- Adicionar tipo 'credit_card' às contas bancárias
-- Cartão de crédito é tratado como conta de PASSIVO (dívida)

-- Remover constraint antiga
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_type_check;

-- Adicionar nova constraint incluindo 'credit_card'
ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_type_check 
  CHECK (type IN ('checking', 'savings', 'wallet', 'investment', 'credit_card', 'other'));

-- Comentário explicativo
COMMENT ON COLUMN bank_accounts.type IS 'Tipo de conta: checking (Conta Corrente - ATIVO), savings (Poupança - ATIVO), wallet (Carteira - ATIVO), investment (Investimentos - ATIVO), credit_card (Cartão de Crédito - PASSIVO), other (Outros - ATIVO)';
