-- Fix budgets table - add all missing columns
-- This migration handles existing budgets table that may be incomplete

-- Step 1: Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN category TEXT NOT NULL DEFAULT 'Outros';
  END IF;
END $$;

-- Step 2: Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN description TEXT;
  END IF;
END $$;

-- Step 3: Add month column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'budgets' 
    AND column_name = 'month'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN month TEXT NOT NULL DEFAULT '2024-12';
    -- Update existing records to have month based on created_at
    UPDATE public.budgets SET month = TO_CHAR(created_at, 'YYYY-MM') WHERE month = '2024-12';
  END IF;
END $$;

-- Step 4: Remove defaults after initial data population
ALTER TABLE public.budgets ALTER COLUMN category DROP DEFAULT;
ALTER TABLE public.budgets ALTER COLUMN month DROP DEFAULT;

-- Step 5: Drop old constraints if they exist
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_month_key;

-- Step 6: Add the unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'budgets_user_id_category_month_key'
  ) THEN
    ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_id_category_month_key UNIQUE(user_id, category, month);
  END IF;
END $$;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category);
