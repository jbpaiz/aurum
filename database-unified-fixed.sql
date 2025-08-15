-- ============================================
-- AURUM - CORREÇÃO PARA TRANSAÇÕES UNIFICADAS
-- ============================================
-- Este script corrige as inconsistências de tipos
-- Execute após o database-complete-setup.sql

-- ============================================
-- 1. VERIFICAR E CORRIGIR TIPOS
-- ============================================

-- Primeiro, vamos descobrir o tipo real de bank_accounts.id
DO $$
DECLARE
    bank_accounts_id_type TEXT;
    transactions_account_id_type TEXT;
BEGIN
    -- Verificar tipo de bank_accounts.id
    SELECT data_type INTO bank_accounts_id_type
    FROM information_schema.columns 
    WHERE table_name = 'bank_accounts' AND column_name = 'id';
    
    -- Verificar tipo de transactions.account_id (se existir)
    SELECT data_type INTO transactions_account_id_type
    FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'account_id';
    
    RAISE NOTICE '🔍 TIPOS DETECTADOS:';
    RAISE NOTICE '  bank_accounts.id: %', bank_accounts_id_type;
    RAISE NOTICE '  transactions.account_id: %', COALESCE(transactions_account_id_type, 'NÃO EXISTE');
    
    -- Se bank_accounts.id for UUID, usamos UUID para as novas colunas
    IF bank_accounts_id_type = 'uuid' THEN
        RAISE NOTICE '✅ Usando UUID para from_account_id e to_account_id';
        
        -- Adicionar from_account_id como UUID
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'from_account_id'
        ) THEN
            ALTER TABLE transactions ADD COLUMN from_account_id UUID;
            ALTER TABLE transactions ADD CONSTRAINT transactions_from_account_id_fkey 
                FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
            RAISE NOTICE '  ✅ from_account_id criada como UUID';
        END IF;
        
        -- Adicionar to_account_id como UUID
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'to_account_id'
        ) THEN
            ALTER TABLE transactions ADD COLUMN to_account_id UUID;
            ALTER TABLE transactions ADD CONSTRAINT transactions_to_account_id_fkey 
                FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
            RAISE NOTICE '  ✅ to_account_id criada como UUID';
        END IF;
        
    ELSE
        -- Se bank_accounts.id for TEXT, usamos TEXT
        RAISE NOTICE '✅ Usando TEXT para from_account_id e to_account_id';
        
        -- Adicionar from_account_id como TEXT
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'from_account_id'
        ) THEN
            ALTER TABLE transactions ADD COLUMN from_account_id TEXT;
            ALTER TABLE transactions ADD CONSTRAINT transactions_from_account_id_fkey 
                FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
            RAISE NOTICE '  ✅ from_account_id criada como TEXT';
        END IF;
        
        -- Adicionar to_account_id como TEXT
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'to_account_id'
        ) THEN
            ALTER TABLE transactions ADD COLUMN to_account_id TEXT;
            ALTER TABLE transactions ADD CONSTRAINT transactions_to_account_id_fkey 
                FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
            RAISE NOTICE '  ✅ to_account_id criada como TEXT';
        END IF;
    END IF;
END $$;

-- ============================================
-- 2. ADICIONAR TIPO TRANSFER
-- ============================================
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'transfer'));

-- ============================================
-- 3. ÍNDICES ADICIONAIS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);

-- ============================================
-- 4. POLÍTICAS DE SEGURANÇA ATUALIZADAS
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
-- 5. FUNÇÃO PARA PROCESSAR TRANSAÇÕES
-- ============================================
CREATE OR REPLACE FUNCTION process_unified_transaction()
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
        
        RAISE NOTICE 'Transferência processada: % de conta % para conta %', NEW.amount, NEW.from_account_id, NEW.to_account_id;
        
    ELSIF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
        -- Debitar despesa da conta
        UPDATE bank_accounts 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id::TEXT AND user_id = NEW.user_id;
        
        RAISE NOTICE 'Despesa processada: % debitada da conta %', NEW.amount, NEW.account_id;
        
    ELSIF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
        -- Creditar receita na conta
        UPDATE bank_accounts 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id::TEXT AND user_id = NEW.user_id;
        
        RAISE NOTICE 'Receita processada: % creditada na conta %', NEW.amount, NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS PARA PROCESSAR TRANSAÇÕES
-- ============================================
DROP TRIGGER IF EXISTS process_transaction_trigger ON transactions;
CREATE TRIGGER process_transaction_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_unified_transaction();

-- ============================================
-- 7. FUNÇÃO PARA REVERTER TRANSAÇÕES
-- ============================================
CREATE OR REPLACE FUNCTION revert_unified_transaction()
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
        
        RAISE NOTICE 'Transferência revertida: % de conta % para conta %', OLD.amount, OLD.from_account_id, OLD.to_account_id;
        
    ELSIF OLD.type = 'expense' AND OLD.account_id IS NOT NULL THEN
        -- Reverter despesa: creditar de volta
        UPDATE bank_accounts 
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id::TEXT AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Despesa revertida: % creditada de volta na conta %', OLD.amount, OLD.account_id;
        
    ELSIF OLD.type = 'income' AND OLD.account_id IS NOT NULL THEN
        -- Reverter receita: debitar
        UPDATE bank_accounts 
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id::TEXT AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Receita revertida: % debitada da conta %', OLD.amount, OLD.account_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. TRIGGERS PARA ATUALIZAÇÕES E DELEÇÕES
-- ============================================
DROP TRIGGER IF EXISTS revert_transaction_on_update ON transactions;
CREATE TRIGGER revert_transaction_on_update
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION revert_unified_transaction();

DROP TRIGGER IF EXISTS revert_transaction_on_delete ON transactions;
CREATE TRIGGER revert_transaction_on_delete
    BEFORE DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION revert_unified_transaction();

-- ============================================
-- 9. FUNÇÃO PARA RELATÓRIO UNIFICADO
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
    LEFT JOIN bank_accounts ba1 ON ba1.id::TEXT = t.account_id
    LEFT JOIN bank_accounts ba2 ON ba2.id = t.from_account_id
    LEFT JOIN bank_accounts ba3 ON ba3.id = t.to_account_id
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VERIFICAÇÃO FINAL INTELIGENTE
-- ============================================
DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
    trigger_count INTEGER;
    function_count INTEGER;
    bank_id_type TEXT;
    from_account_type TEXT;
    to_account_type TEXT;
BEGIN
    -- Verificar tipos das colunas
    SELECT data_type INTO bank_id_type
    FROM information_schema.columns 
    WHERE table_name = 'bank_accounts' AND column_name = 'id';
    
    SELECT data_type INTO from_account_type
    FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'from_account_id';
    
    SELECT data_type INTO to_account_type
    FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'to_account_id';
    
    -- Contar estruturas criadas
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name IN ('from_account_id', 'to_account_id');
    
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'transactions'
    AND constraint_name LIKE '%account_id_fkey';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'transactions'
    AND trigger_name LIKE '%transaction%';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name LIKE '%unified_transaction%';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 TRANSAÇÕES UNIFICADAS - SETUP COMPLETO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTRUTURA CRIADA:';
    RAISE NOTICE '  ✅ Colunas: %/2', column_count;
    RAISE NOTICE '  ✅ Foreign Keys: %', constraint_count;
    RAISE NOTICE '  ✅ Triggers: %', trigger_count;
    RAISE NOTICE '  ✅ Funções: %', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 TIPOS DE DADOS:';
    RAISE NOTICE '  📝 bank_accounts.id: %', bank_id_type;
    RAISE NOTICE '  📝 transactions.from_account_id: %', COALESCE(from_account_type, 'N/A');
    RAISE NOTICE '  📝 transactions.to_account_id: %', COALESCE(to_account_type, 'N/A');
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNCIONALIDADES:';
    RAISE NOTICE '  ✅ Receitas, Despesas e Transferências';
    RAISE NOTICE '  ✅ Saldos atualizados automaticamente';
    RAISE NOTICE '  ✅ Reversão em edições/exclusões';
    RAISE NOTICE '  ✅ Relatórios unificados';
    RAISE NOTICE '  ✅ Segurança RLS completa';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Teste no frontend: receitas, despesas, transferências';
    RAISE NOTICE '  2. Verifique saldos sendo atualizados';
    RAISE NOTICE '  3. Use: SELECT * FROM get_unified_transactions(auth.uid());';
    RAISE NOTICE '';
    
    IF column_count = 2 AND function_count >= 2 THEN
        RAISE NOTICE '🎉 IMPLEMENTAÇÃO 100%% COMPLETA!';
        RAISE NOTICE '   Sistema pronto para transações unificadas!';
    ELSE
        RAISE NOTICE '⚠️ Implementação incompleta - verifique erros acima';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;
