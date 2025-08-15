-- Script para verificar os tipos de dados das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('bank_accounts', 'transactions')
AND column_name IN ('id', 'account_id', 'from_account_id', 'to_account_id')
ORDER BY table_name, column_name;
