-- Fix budgets table - add month column and update constraint
-- This migration handles existing budgets table

-- Step 1: Add month column with a default value
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS month TEXT NOT NULL DEFAULT '2024-12';

-- Step 2: Update existing records to have current month
UPDATE public.budgets 
SET month = TO_CHAR(created_at, 'YYYY-MM') 
WHERE month = '2024-12';

-- Step 3: Remove the default so future inserts must specify month
ALTER TABLE public.budgets 
ALTER COLUMN month DROP DEFAULT;

-- Step 4: Drop the old unique constraint if it exists
ALTER TABLE public.budgets 
DROP CONSTRAINT IF EXISTS budgets_user_id_category_month_key;

-- Step 5: Add the new unique constraint
ALTER TABLE public.budgets 
ADD CONSTRAINT budgets_user_id_category_month_key 
UNIQUE(user_id, category, month);

-- Step 6: Create index on month if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(month);
