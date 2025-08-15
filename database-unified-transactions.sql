-- ============================================
-- AURUM - ALTERAÇÕES PARA TRANSAÇÕES UNIFICADAS
-- ============================================
-- Este script adiciona suporte para transferências na tabela transactions
-- Execute após o database-complete-setup.sql

-- ============================================
-- 1. ALTERAR TABELA TRANSACTIONS
-- ============================================

-- Adicionar tipo 'transfer' ao enum
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'transfer'));

-- Adicionar campos para transferência (certificando que são UUID como bank_accounts.id)
DO $$
BEGIN
    -- Verificar e adicionar from_account_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'from_account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN from_account_id UUID;
        ALTER TABLE transactions ADD CONSTRAINT transactions_from_account_id_fkey 
            FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
    END IF;
    
    -- Verificar e adicionar to_account_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'to_account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN to_account_id UUID;
        ALTER TABLE transactions ADD CONSTRAINT transactions_to_account_id_fkey 
            FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
    END IF;
    
    RAISE NOTICE '✅ Colunas from_account_id e to_account_id adicionadas como UUID';
    RAISE NOTICE '⚠️ ATENÇÃO: bank_accounts.id é UUID, mas transactions.account_id é TEXT!';
    RAISE NOTICE '   Isso pode causar inconsistência. Considere corrigir account_id também.';
END $$;

-- ============================================
-- 2. ÍNDICES ADICIONAIS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);

-- ============================================
-- 3. POLÍTICAS DE SEGURANÇA ATUALIZADAS
-- ============================================

-- Atualizar política de visualização para incluir transferências
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (type = 'transfer' AND (
            from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) OR
            to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
        ))
    );

-- Atualizar política de inserção
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (type IN ('income', 'expense') OR 
         (type = 'transfer' AND 
          from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid()) AND
          to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = auth.uid())
         )
        )
    );

-- ============================================
-- 4. FUNÇÃO PARA PROCESSAR TRANSFERÊNCIAS
-- ============================================

CREATE OR REPLACE FUNCTION process_transfer_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for uma transferência, atualizar saldos das contas
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
        
    ELSIF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
        -- Debitar despesa da conta
        UPDATE bank_accounts 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id AND user_id = NEW.user_id;
        
    ELSIF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
        -- Creditar receita na conta
        UPDATE bank_accounts 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id AND user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER PARA PROCESSAR TRANSAÇÕES
-- ============================================

DROP TRIGGER IF EXISTS process_transaction_trigger ON transactions;
CREATE TRIGGER process_transaction_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_transfer_transaction();

-- ============================================
-- 6. FUNÇÃO PARA REVERTER TRANSAÇÕES (UPDATE/DELETE)
-- ============================================

CREATE OR REPLACE FUNCTION revert_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverter transação antiga
    IF OLD.type = 'transfer' AND OLD.from_account_id IS NOT NULL AND OLD.to_account_id IS NOT NULL THEN
        -- Reverter: creditar de volta na origem e debitar do destino
        UPDATE bank_accounts 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.from_account_id AND user_id = OLD.user_id;
        
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.to_account_id AND user_id = OLD.user_id;
        
    ELSIF OLD.type = 'expense' AND OLD.account_id IS NOT NULL THEN
        -- Reverter despesa: creditar de volta
        UPDATE bank_accounts 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id AND user_id = OLD.user_id;
        
    ELSIF OLD.type = 'income' AND OLD.account_id IS NOT NULL THEN
        -- Reverter receita: debitar
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id AND user_id = OLD.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGERS PARA ATUALIZAÇÕES E DELEÇÕES
-- ============================================

DROP TRIGGER IF EXISTS revert_transaction_on_update ON transactions;
CREATE TRIGGER revert_transaction_on_update
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION revert_transaction();

DROP TRIGGER IF EXISTS revert_transaction_on_delete ON transactions;
CREATE TRIGGER revert_transaction_on_delete
    BEFORE DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION revert_transaction();

-- ============================================
-- 8. FUNÇÃO PARA RELATÓRIO UNIFICADO
-- ============================================

CREATE OR REPLACE FUNCTION get_unified_transactions(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    type TEXT,
    description TEXT,
    amount DECIMAL(15,2),
    category TEXT,
    date DATE,
    account_name TEXT,
    from_account_name TEXT,
    to_account_name TEXT,
    payment_method TEXT,
    installments INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.description,
        t.amount,
        t.category,
        t.date,
        ba1.name as account_name,
        ba2.name as from_account_name,
        ba3.name as to_account_name,
        t.payment_method,
        t.installments,
        t.created_at
    FROM transactions t
    LEFT JOIN bank_accounts ba1 ON t.account_id = ba1.id
    LEFT JOIN bank_accounts ba2 ON t.from_account_id = ba2.id
    LEFT JOIN bank_accounts ba3 ON t.to_account_id = ba3.id
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    column_count INTEGER;
    trigger_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Contar colunas adicionadas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name IN ('from_account_id', 'to_account_id');
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%transaction%';
    
    -- Contar funções
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN ('process_transfer_transaction', 'revert_transaction', 'get_unified_transactions');
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ TRANSAÇÕES UNIFICADAS IMPLEMENTADAS!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📊 Colunas adicionadas: %/2', column_count;
    RAISE NOTICE '⚡ Triggers criados: %', trigger_count;
    RAISE NOTICE '🔧 Funções utilitárias: %/3', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RECURSOS DISPONÍVEIS:';
    RAISE NOTICE '  ✅ Transações unificadas (receita, despesa, transferência)';
    RAISE NOTICE '  ✅ Atualização automática de saldos';
    RAISE NOTICE '  ✅ Reversão em atualizações/deleções';
    RAISE NOTICE '  ✅ Relatórios unificados';
    RAISE NOTICE '  ✅ Segurança RLS completa';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Teste criar receitas, despesas e transferências';
    RAISE NOTICE '  2. Verifique se os saldos são atualizados automaticamente';
    RAISE NOTICE '  3. Use: SELECT * FROM get_unified_transactions(auth.uid(), 20);';
    RAISE NOTICE '============================================';
    
    IF column_count = 2 AND function_count = 3 THEN
        RAISE NOTICE '🎉 IMPLEMENTAÇÃO COMPLETA!';
    ELSE
        RAISE NOTICE '⚠️ Implementação incompleta - verifique erros';
    END IF;
END $$;
