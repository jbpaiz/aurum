-- Adiciona preferências de visibilidade adicionais para as seções de Saúde
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_weight BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_body BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_hydration BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_sleep BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_goals BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.user_preferences.show_weight IS 'Seção Peso visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_body IS 'Seção Medidas corporais visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_hydration IS 'Seção Hidratação visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_activity IS 'Seção Atividades visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_sleep IS 'Seção Sono visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_goals IS 'Mostrar cartão de Metas no Painel de Saúde';
