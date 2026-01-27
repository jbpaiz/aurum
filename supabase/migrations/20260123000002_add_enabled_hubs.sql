-- Migration: add enabled_hubs column to user_preferences

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS enabled_hubs text[] DEFAULT ARRAY['finance','tasks','health','vehicles'];

-- Update existing rows to set enabled_hubs if null
UPDATE public.user_preferences
SET enabled_hubs = ARRAY['finance','tasks','health','vehicles']
WHERE enabled_hubs IS NULL;
