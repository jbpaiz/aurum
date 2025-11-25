-- ================================================
-- POPULAÇÃO INICIAL DE DADOS
-- ================================================

-- ================================================
-- 1. PROVEDORES DE CARTÃO (Card Providers)
-- ================================================
INSERT INTO card_providers (id, name, icon, color, popular_brands, supported_types) VALUES
('nubank', 'Nubank', '💜', '#8A05BE', ARRAY['Nubank', 'Nu'], ARRAY['credit', 'debit']),
('mercadopago', 'Mercado Pago', '💙', '#009EE3', ARRAY['Mercado Pago', 'MP'], ARRAY['credit', 'debit']),
('picpay', 'PicPay', '💚', '#21C25E', ARRAY['PicPay'], ARRAY['credit', 'debit']),
('inter', 'Banco Inter', '🧡', '#FF7A00', ARRAY['Inter', 'Banco Inter'], ARRAY['credit', 'debit']),
('c6bank', 'C6 Bank', '💛', '#FFEF00', ARRAY['C6', 'C6 Bank'], ARRAY['credit', 'debit']),
('itau', 'Itaú', '🔶', '#EC7000', ARRAY['Itaú', 'Itaucard'], ARRAY['credit', 'debit']),
('bradesco', 'Bradesco', '🔴', '#CC092F', ARRAY['Bradesco', 'Bradescard'], ARRAY['credit', 'debit']),
('santander', 'Santander', '🔺', '#EC0000', ARRAY['Santander', 'Santander Esfera'], ARRAY['credit', 'debit']),
('bb', 'Banco do Brasil', '🟡', '#FFED00', ARRAY['BB', 'Banco do Brasil', 'Ourocard'], ARRAY['credit', 'debit']),
('caixa', 'Caixa Econômica', '🔵', '#0072CE', ARRAY['Caixa', 'Caixa Econômica'], ARRAY['credit', 'debit']),
('xp', 'XP Investimentos', '⚫', '#000000', ARRAY['XP', 'XP Investimentos'], ARRAY['credit', 'debit']),
('btg', 'BTG Pactual', '⚪', '#1B1B1B', ARRAY['BTG', 'BTG Pactual'], ARRAY['credit', 'debit']),
('other', 'Outro', '💳', '#6B7280', ARRAY[]::TEXT[], ARRAY['credit', 'debit'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    popular_brands = EXCLUDED.popular_brands,
    supported_types = EXCLUDED.supported_types;

-- ================================================
-- 2. CATEGORIAS PADRÃO (Default Categories)
-- ================================================

-- Categorias de Receita
INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
-- Receitas
(NULL, 'Salário', 'income', '💰', '#10B981', true),
(NULL, 'Freelance', 'income', '💼', '#059669', true),
(NULL, 'Investimentos', 'income', '📈', '#0891B2', true),
(NULL, 'Aluguel Recebido', 'income', '🏠', '#3B82F6', true),
(NULL, 'Vendas', 'income', '🛒', '#8B5CF6', true),
(NULL, 'Prêmios', 'income', '🏆', '#F59E0B', true),
(NULL, 'Cashback', 'income', '🎁', '#EC4899', true),
(NULL, 'Outros', 'income', '💸', '#6B7280', true),

-- Despesas
(NULL, 'Alimentação', 'expense', '🍕', '#EF4444', true),
(NULL, 'Transporte', 'expense', '🚗', '#F97316', true),
(NULL, 'Moradia', 'expense', '🏡', '#84CC16', true),
(NULL, 'Saúde', 'expense', '🏥', '#06B6D4', true),
(NULL, 'Educação', 'expense', '📚', '#3B82F6', true),
(NULL, 'Lazer', 'expense', '🎮', '#8B5CF6', true),
(NULL, 'Compras', 'expense', '🛍️', '#EC4899', true),
(NULL, 'Serviços', 'expense', '🔧', '#6B7280', true),
(NULL, 'Investimentos', 'expense', '📊', '#059669', true),
(NULL, 'Assinatura', 'expense', '📱', '#F59E0B', true),
(NULL, 'Viagem', 'expense', '✈️', '#06B6D4', true),
(NULL, 'Pets', 'expense', '🐕', '#84CC16', true),
(NULL, 'Presentes', 'expense', '🎁', '#EC4899', true),
(NULL, 'Outros', 'expense', '💳', '#6B7280', true)
ON CONFLICT DO NOTHING;

-- ================================================
-- FUNÇÃO PARA CRIAR DADOS DEMO PARA USUÁRIO
-- ================================================
CREATE OR REPLACE FUNCTION create_demo_data_for_user(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    -- IDs das contas que serão criadas
    carteira_id UUID;
    cofrinho_id UUID;
    nubank_id UUID;
    bb_poupanca_id UUID;
    caixa_poupanca_id UUID;
    itau_conta_id UUID;
    inter_invest_id UUID;
    
    -- IDs dos cartões
    nubank_credit_id UUID;
    nubank_debit_id UUID;
    bb_credit_id UUID;
    bb_debit_id UUID;
    itau_credit_id UUID;
    
    -- IDs dos métodos de pagamento
    dinheiro_id UUID;
    pix_nubank_id UUID;
    pix_itau_id UUID;
    transfer_bb_id UUID;
    transfer_caixa_id UUID;
    
    -- IDs das categorias
    salario_cat_id UUID;
    alimentacao_cat_id UUID;
    transporte_cat_id UUID;
    freelance_cat_id UUID;
    lazer_cat_id UUID;
BEGIN
    -- 1. CRIAR CONTAS BANCÁRIAS
    INSERT INTO bank_accounts (user_id, name, type, bank, icon, color, balance, is_active) VALUES
    (user_uuid, 'Carteira', 'wallet', NULL, '💰', '#10B981', 120.00, true),
    (user_uuid, 'Cofrinho', 'wallet', NULL, '🐷', '#F59E0B', 450.00, true),
    (user_uuid, 'Nubank', 'checking', 'nubank', '💜', '#8A05BE', 2500.00, true),
    (user_uuid, 'BB Poupança', 'savings', 'bb', '🟡', '#FFED00', 8750.00, true),
    (user_uuid, 'Caixa Poupança', 'savings', 'caixa', '🔵', '#0072CE', 15200.00, true),
    (user_uuid, 'Itaú Conta Corrente', 'checking', 'itau', '🔶', '#EC7000', 3200.00, true),
    (user_uuid, 'Inter Investimentos', 'investment', 'inter', '📈', '#FF7A00', 12500.00, true)
    RETURNING id INTO carteira_id, cofrinho_id, nubank_id, bb_poupanca_id, caixa_poupanca_id, itau_conta_id, inter_invest_id;
    
    -- Capturar IDs das contas individualmente
    SELECT id INTO carteira_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Carteira';
    SELECT id INTO cofrinho_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Cofrinho';
    SELECT id INTO nubank_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Nubank';
    SELECT id INTO bb_poupanca_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'BB Poupança';
    SELECT id INTO caixa_poupanca_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Caixa Poupança';
    SELECT id INTO itau_conta_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Itaú Conta Corrente';
    SELECT id INTO inter_invest_id FROM bank_accounts WHERE user_id = user_uuid AND name = 'Inter Investimentos';
    
    -- 2. CRIAR CARTÕES
    INSERT INTO cards (user_id, provider_id, account_id, alias, last_four_digits, type, is_active) VALUES
    (user_uuid, 'nubank', nubank_id, 'Nubank Roxinho', '1234', 'credit', true),
    (user_uuid, 'nubank', nubank_id, 'Nu Débito', '5678', 'debit', true),
    (user_uuid, 'bb', bb_poupanca_id, 'BB Ourocard Visa', '3456', 'credit', true),
    (user_uuid, 'bb', bb_poupanca_id, 'BB Conta Corrente', '7890', 'debit', true),
    (user_uuid, 'itau', itau_conta_id, 'Itaucard Internacional', '6789', 'credit', true);
    
    -- Capturar IDs dos cartões
    SELECT id INTO nubank_credit_id FROM cards WHERE user_id = user_uuid AND alias = 'Nubank Roxinho';
    SELECT id INTO nubank_debit_id FROM cards WHERE user_id = user_uuid AND alias = 'Nu Débito';
    SELECT id INTO bb_credit_id FROM cards WHERE user_id = user_uuid AND alias = 'BB Ourocard Visa';
    SELECT id INTO bb_debit_id FROM cards WHERE user_id = user_uuid AND alias = 'BB Conta Corrente';
    SELECT id INTO itau_credit_id FROM cards WHERE user_id = user_uuid AND alias = 'Itaucard Internacional';
    
    -- 3. CRIAR MÉTODOS DE PAGAMENTO
    INSERT INTO payment_methods (user_id, name, type, account_id, card_id, icon, color, is_active) VALUES
    (user_uuid, 'Dinheiro - Carteira', 'cash', carteira_id, NULL, '💵', '#10B981', true),
    (user_uuid, 'PIX - Nubank', 'pix', nubank_id, NULL, '📱', '#8A05BE', true),
    (user_uuid, 'PIX - Itaú', 'pix', itau_conta_id, NULL, '📱', '#EC7000', true),
    (user_uuid, 'Transferência BB', 'bank_transfer', bb_poupanca_id, NULL, '🔄', '#FFED00', true),
    (user_uuid, 'Transferência Caixa', 'bank_transfer', caixa_poupanca_id, NULL, '🔄', '#0072CE', true),
    (user_uuid, 'Nubank Roxinho', 'credit_card', nubank_id, nubank_credit_id, '💳', '#8A05BE', true),
    (user_uuid, 'Nu Débito', 'debit_card', nubank_id, nubank_debit_id, '🏧', '#8A05BE', true),
    (user_uuid, 'BB Ourocard Visa', 'credit_card', bb_poupanca_id, bb_credit_id, '💳', '#FFED00', true),
    (user_uuid, 'BB Conta Corrente', 'debit_card', bb_poupanca_id, bb_debit_id, '🏧', '#FFED00', true),
    (user_uuid, 'Itaucard Internacional', 'credit_card', itau_conta_id, itau_credit_id, '💳', '#EC7000', true);
    
    -- 4. COPIAR CATEGORIAS PADRÃO PARA O USUÁRIO
    INSERT INTO categories (user_id, name, type, icon, color, is_default)
    SELECT user_uuid, name, type, icon, color, false
    FROM categories 
    WHERE user_id IS NULL AND is_default = true;
    
    -- Capturar IDs das categorias
    SELECT id INTO salario_cat_id FROM categories WHERE user_id = user_uuid AND name = 'Salário';
    SELECT id INTO alimentacao_cat_id FROM categories WHERE user_id = user_uuid AND name = 'Alimentação';
    SELECT id INTO transporte_cat_id FROM categories WHERE user_id = user_uuid AND name = 'Transporte';
    SELECT id INTO freelance_cat_id FROM categories WHERE user_id = user_uuid AND name = 'Freelance';
    SELECT id INTO lazer_cat_id FROM categories WHERE user_id = user_uuid AND name = 'Lazer';
    
    -- Capturar IDs dos métodos de pagamento
    SELECT id INTO dinheiro_id FROM payment_methods WHERE user_id = user_uuid AND name = 'Dinheiro - Carteira';
    SELECT id INTO pix_nubank_id FROM payment_methods WHERE user_id = user_uuid AND name = 'PIX - Nubank';
    SELECT id INTO pix_itau_id FROM payment_methods WHERE user_id = user_uuid AND name = 'PIX - Itaú';
    
    -- 5. CRIAR TRANSAÇÕES DE DEMONSTRAÇÃO
    INSERT INTO transactions (user_id, type, description, amount, category_id, payment_method_id, account_id, transaction_date, notes) VALUES
    -- Receitas
    (user_uuid, 'income', 'Salário Janeiro', 5000.00, salario_cat_id, pix_nubank_id, nubank_id, CURRENT_DATE - INTERVAL '5 days', 'Salário mensal'),
    (user_uuid, 'income', 'Freelance Site', 1200.00, freelance_cat_id, pix_itau_id, itau_conta_id, CURRENT_DATE - INTERVAL '3 days', 'Desenvolvimento de site'),
    
    -- Despesas
    (user_uuid, 'expense', 'Supermercado', 250.00, alimentacao_cat_id, dinheiro_id, carteira_id, CURRENT_DATE - INTERVAL '2 days', 'Compras da semana'),
    (user_uuid, 'expense', 'Gasolina', 180.00, transporte_cat_id, pix_nubank_id, nubank_id, CURRENT_DATE - INTERVAL '1 day', 'Abastecimento'),
    (user_uuid, 'expense', 'Cinema', 60.00, lazer_cat_id, dinheiro_id, carteira_id, CURRENT_DATE, 'Filme com a família');
    
    RAISE NOTICE 'Dados demo criados com sucesso para o usuário %', user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNÇÃO PARA EXECUTAR AO CRIAR NOVO USUÁRIO
-- ================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_demo_data_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
