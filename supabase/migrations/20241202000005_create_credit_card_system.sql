-- ============================================
-- SISTEMA COMPLETO DE CARTÃO DE CRÉDITO
-- ============================================
-- Estrutura para gerenciar faturas, parcelas e compras

-- 1. Tabela de Faturas do Cartão
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  
  -- Informações da fatura
  reference_month TEXT NOT NULL, -- Formato: YYYY-MM
  due_date DATE NOT NULL,
  closing_date DATE NOT NULL,
  
  -- Valores
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'overdue')),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: uma fatura por mês por cartão
  UNIQUE(card_id, reference_month)
);

-- 2. Tabela de Compras no Cartão
CREATE TABLE IF NOT EXISTS public.credit_card_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Informações da compra
  description TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  
  -- Parcelamento
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installments INTEGER NOT NULL DEFAULT 1 CHECK (installments > 0),
  current_installment INTEGER NOT NULL DEFAULT 1 CHECK (current_installment > 0),
  installment_amount DECIMAL(15, 2) CHECK (installment_amount > 0),
  parent_purchase_id UUID REFERENCES public.credit_card_purchases(id) ON DELETE CASCADE,
  
  -- Metadados
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Pagamentos de Fatura
CREATE TABLE IF NOT EXISTS public.credit_card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.credit_card_invoices(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  
  -- Informações do pagamento
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Adicionar colunas necessárias na tabela cards se não existirem
DO $$ 
BEGIN
  -- Dia de vencimento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cards' 
    AND column_name = 'due_day'
  ) THEN
    ALTER TABLE public.cards ADD COLUMN due_day INTEGER NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31);
  END IF;
  
  -- Dia de fechamento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cards' 
    AND column_name = 'closing_day'
  ) THEN
    ALTER TABLE public.cards ADD COLUMN closing_day INTEGER NOT NULL DEFAULT 5 CHECK (closing_day BETWEEN 1 AND 31);
  END IF;
  
  -- Saldo atual da fatura
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cards' 
    AND column_name = 'current_balance'
  ) THEN
    ALTER TABLE public.cards ADD COLUMN current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0);
  END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_payments ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.credit_card_invoices;

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.credit_card_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.credit_card_purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON public.credit_card_purchases;
DROP POLICY IF EXISTS "Users can delete their own purchases" ON public.credit_card_purchases;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.credit_card_payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.credit_card_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.credit_card_payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.credit_card_payments;

-- 7. Create RLS policies - Invoices
CREATE POLICY "Users can view their own invoices"
  ON public.credit_card_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON public.credit_card_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.credit_card_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.credit_card_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create RLS policies - Purchases
CREATE POLICY "Users can view their own purchases"
  ON public.credit_card_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON public.credit_card_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
  ON public.credit_card_purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
  ON public.credit_card_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Create RLS policies - Payments
CREATE POLICY "Users can view their own payments"
  ON public.credit_card_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.credit_card_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.credit_card_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.credit_card_payments FOR DELETE
  USING (auth.uid() = user_id);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.credit_card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_card_id ON public.credit_card_invoices(card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_reference_month ON public.credit_card_invoices(reference_month);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.credit_card_invoices(status);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.credit_card_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_card_id ON public.credit_card_purchases(card_id);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice_id ON public.credit_card_purchases(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.credit_card_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_parent_id ON public.credit_card_purchases(parent_purchase_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.credit_card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.credit_card_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.credit_card_payments(payment_date);

-- 11. Create function to auto-update remaining_amount
CREATE OR REPLACE FUNCTION update_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount := NEW.total_amount - NEW.paid_amount;
  NEW.updated_at := CURRENT_TIMESTAMP;
  
  -- Auto-update status based on amounts
  IF NEW.remaining_amount <= 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.remaining_amount > 0 THEN
    NEW.status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_amounts ON public.credit_card_invoices;
CREATE TRIGGER trigger_update_invoice_amounts
  BEFORE INSERT OR UPDATE ON public.credit_card_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_amounts();
