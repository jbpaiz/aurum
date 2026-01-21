-- Adiciona preferências de visibilidade das seções de Saúde
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_nutrition BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_achievements BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.user_preferences.show_nutrition IS 'Seção Nutrição visível no painel de Saúde';
COMMENT ON COLUMN public.user_preferences.show_achievements IS 'Seção Conquistas visível no painel de Saúde';
