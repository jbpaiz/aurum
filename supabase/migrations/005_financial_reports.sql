-- ================================================
-- 005 - FINANCIAL REPORT TABLES
-- ================================================

-- Tables to persist generated income/expense reports directly from the web app

-- 1. Financial reports metadata
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_income NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_expense NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Report line items referencing the original transactions
CREATE TABLE IF NOT EXISTS financial_report_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES financial_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('income','expense')) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_id ON financial_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_report_lines_report_id ON financial_report_lines(report_id);
CREATE INDEX IF NOT EXISTS idx_financial_report_lines_user_id ON financial_report_lines(user_id);

-- Row Level Security
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_report_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own reports" ON financial_reports
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access their own report lines" ON financial_report_lines
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_financial_reports_updated_at
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
