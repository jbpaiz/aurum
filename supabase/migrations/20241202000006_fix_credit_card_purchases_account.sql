-- ============================================
-- FIX: Tornar account_id opcional em credit_card_purchases
-- ============================================
-- Compras no cartão de crédito NÃO devem ter conta associada
-- pois o dinheiro ainda não saiu de nenhuma conta

-- Verificar se a tabela existe antes de alterar
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_card_purchases' 
    AND column_name = 'account_id'
  ) THEN
    -- Se a coluna existir, removê-la
    ALTER TABLE public.credit_card_purchases DROP COLUMN IF EXISTS account_id;
  END IF;
END $$;

-- Adicionar comentário explicativo na tabela
COMMENT ON TABLE public.credit_card_purchases IS 'Compras realizadas no cartão de crédito. Não possui account_id pois o dinheiro ainda não saiu de nenhuma conta - será debitado apenas quando pagar a fatura.';
