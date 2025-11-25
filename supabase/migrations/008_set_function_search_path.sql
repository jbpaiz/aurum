-- ================================================
-- 008 - FIX FUNCTION SEARCH PATH
-- ================================================
-- Ensures every exposed plpgsql function has an explicit, immutable search_path.
-- This removes Supabase lint warning 0011_function_search_path_mutable.

ALTER FUNCTION public.update_account_balance() SET search_path = public, auth;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, auth;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;

-- Demo data routine
ALTER FUNCTION public.create_demo_data_for_user(uuid) SET search_path = public, auth;

-- Unified transaction pipeline
ALTER FUNCTION public.process_unified_transaction() SET search_path = public, auth;
ALTER FUNCTION public.revert_unified_transaction() SET search_path = public, auth;
ALTER FUNCTION public.get_unified_transactions(uuid, integer) SET search_path = public, auth;
