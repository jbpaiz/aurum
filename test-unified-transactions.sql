-- ============================================
-- TESTE DAS TRANSAÇÕES UNIFICADAS
-- ============================================
-- Execute após o database-unified-fixed.sql

-- 1. Verificar estrutura existente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('bank_accounts', 'transactions')
    AND column_name LIKE '%account%'
ORDER BY table_name, column_name;

-- 2. Verificar foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'transactions'
    AND kcu.column_name LIKE '%account%';

-- 3. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions'
ORDER BY trigger_name;

-- 4. Testar consulta unificada
SELECT 'Testando função get_unified_transactions...' as status;

-- 5. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;
