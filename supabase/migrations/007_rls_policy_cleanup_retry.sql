-- ================================================
-- 007 - RLS POLICY STANDARDIZATION (RETRY)
-- ================================================
-- Ensures all row level security policies use (SELECT auth.uid()) and removes
-- any duplicated legacy policies that may still exist after earlier migrations.

-- Bank accounts
DROP POLICY IF EXISTS "Users can view own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can insert their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can insert their own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can update their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON bank_accounts;
CREATE POLICY "Users can delete their own bank accounts" ON bank_accounts
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Cards
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
CREATE POLICY "Users can view their own cards" ON cards
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
CREATE POLICY "Users can insert their own cards" ON cards
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
CREATE POLICY "Users can update their own cards" ON cards
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;
CREATE POLICY "Users can delete their own cards" ON cards
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Payment methods
DROP POLICY IF EXISTS "Users can view own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Categories
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING ((SELECT auth.uid()) = user_id OR is_default = true);

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING ((SELECT auth.uid()) = user_id AND is_default = false);

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING ((SELECT auth.uid()) = user_id AND is_default = false);

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Transfers
DROP POLICY IF EXISTS "Users can view own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can view their own transfers" ON transfers;
CREATE POLICY "Users can view their own transfers" ON transfers
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can insert their own transfers" ON transfers;
CREATE POLICY "Users can insert their own transfers" ON transfers
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can update their own transfers" ON transfers;
CREATE POLICY "Users can update their own transfers" ON transfers
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transfers" ON transfers;
DROP POLICY IF EXISTS "Users can delete their own transfers" ON transfers;
CREATE POLICY "Users can delete their own transfers" ON transfers
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
CREATE POLICY "Users can insert their own budgets" ON budgets
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Financial reports
DROP POLICY IF EXISTS "Users can access their own reports" ON financial_reports;
CREATE POLICY "Users can access their own reports" ON financial_reports
    FOR ALL USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can access their own report lines" ON financial_report_lines;
CREATE POLICY "Users can access their own report lines" ON financial_report_lines
    FOR ALL USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
